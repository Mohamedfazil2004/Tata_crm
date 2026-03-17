const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const path = require('path');
const db = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, `leads_${Date.now()}_${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.xlsx', '.xls', '.csv'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel (.xlsx, .xls) and CSV files are allowed'));
    }
  }
});

// Columns to REMOVE from the uploaded Excel
const COLUMNS_TO_REMOVE = [
  'id', 'created_time', 'ad_id', 'ad_name', 'adset_id', 'adset_name',
  'campaign_id', 'campaign_name', 'form_id', 'form_name', 'is_organic', 'platform'
];

// Tamil column to English field mapping
const COLUMN_MAP = {
  'உங்கள்_மாவட்டம்': 'location',
  'உங்களுக்கு_விருப்பப்பட்ட_வாகனம்': 'model',
  'full name': 'full_name',
  'full_name': 'full_name',
  'phone_number': 'phone_number',
  'phone number': 'phone_number',
  // Also handle common variants
  'name': 'full_name',
  'location': 'location',
  'model': 'model',
};

// Normalize district name for matching
function normalizeDistrict(district) {
  if (!district) return 'others';
  return district.toString().toLowerCase().trim().replace(/\s+/g, '_');
}

// Date adjustment logic: all dates older than upload_date-1 → upload_date-1
function adjustLeadDate(leadDate, uploadDate) {
  if (!leadDate) return uploadDate;
  
  let ld;
  if (leadDate instanceof Date) {
    ld = new Date(leadDate);
  } else if (typeof leadDate === 'number') {
    // Excel serial date
    ld = XLSX.SSF.parse_date_code(leadDate);
    ld = new Date(ld.y, ld.m - 1, ld.d);
  } else {
    // Try parse string
    ld = new Date(leadDate);
  }

  if (isNaN(ld.getTime())) return uploadDate;

  // "previous day" relative to upload date
  const prevDay = new Date(uploadDate);
  prevDay.setDate(prevDay.getDate() - 1);

  // If lead date is before or equal to prev day → set to prev day
  if (ld <= prevDay) {
    return prevDay.toISOString().split('T')[0];
  }
  // If lead date is upload day or future → prev day
  if (ld >= new Date(uploadDate)) {
    return prevDay.toISOString().split('T')[0];
  }
  return ld.toISOString().split('T')[0];
}

// Find dealer by district
async function findDealerByDistrict(district) {
  const normalized = normalizeDistrict(district);
  const [rows] = await db.query(
    `SELECT d.id, d.dealer_name FROM district_dealer_mapping ddm 
     JOIN dealers d ON ddm.dealer_id = d.id 
     WHERE ddm.district_normalized = ?`,
    [normalized]
  );
  if (rows.length > 0) return rows[0];

  // Fallback: try partial match
  const [rows2] = await db.query(
    `SELECT d.id, d.dealer_name FROM district_dealer_mapping ddm 
     JOIN dealers d ON ddm.dealer_id = d.id 
     WHERE ? LIKE CONCAT('%', ddm.district_normalized, '%') OR ddm.district_normalized LIKE CONCAT('%', ?, '%')
     LIMIT 1`,
    [normalized, normalized]
  );
  if (rows2.length > 0) return rows2[0];

  // Default to "Others"
  const [others] = await db.query(`SELECT id, dealer_name FROM dealers WHERE dealer_name = 'Others' LIMIT 1`);
  return others[0] || { id: 13, dealer_name: 'Others' };
}

// POST /api/upload/leads
router.post('/leads', authenticate, authorize('admin', 'campaign_team'), upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  const uploadDate = new Date().toISOString().split('T')[0];
  let batchId;

  try {
    // Create upload batch record
    const [batchResult] = await db.query(
      `INSERT INTO upload_batches (upload_date, file_name, total_records, uploaded_by, status) VALUES (?, ?, 0, ?, 'processing')`,
      [uploadDate, req.file.originalname, req.user.id]
    );
    batchId = batchResult.insertId;

    // Parse Excel file
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

    if (rawData.length < 2) {
      await db.query(`UPDATE upload_batches SET status='failed', error_log=? WHERE id=?`, ['Empty file or no data rows', batchId]);
      return res.status(400).json({ success: false, message: 'File is empty or has no data rows' });
    }

    // Get headers (first row)
    const headers = rawData[0].map(h => (h || '').toString().trim().toLowerCase());

    // Build column indices mapping
    const colIndex = {};
    headers.forEach((h, i) => {
      if (COLUMN_MAP[h]) {
        colIndex[COLUMN_MAP[h]] = i;
      }
      // also try original header
      Object.keys(COLUMN_MAP).forEach(key => {
        if (h === key.toLowerCase() || h.includes(key.toLowerCase())) {
          colIndex[COLUMN_MAP[key]] = i;
        }
      });
    });

    // Find Tamil column headers by index (case-insensitive unicode match)
    const tamilLocationKey = Object.keys(COLUMN_MAP).find(k => k.includes('மாவட்டம்'));
    const tamilModelKey = Object.keys(COLUMN_MAP).find(k => k.includes('விருப்பப்பட்ட'));

    headers.forEach((h, i) => {
      const orig = (rawData[0][i] || '').toString().trim();
      if (tamilLocationKey && (orig === tamilLocationKey || orig.toLowerCase() === tamilLocationKey.toLowerCase())) {
        colIndex['location'] = i;
      }
      if (tamilModelKey && (orig === tamilModelKey || orig.toLowerCase() === tamilModelKey.toLowerCase())) {
        colIndex['model'] = i;
      }
      // full name variants
      if (orig.toLowerCase().includes('full') && orig.toLowerCase().includes('name')) {
        colIndex['full_name'] = i;
      }
      if (orig.toLowerCase().includes('phone')) {
        colIndex['phone_number'] = i;
      }
    });

    // Also detect created_time column for date extraction
    let createdTimeIdx = headers.findIndex(h => h.includes('created_time'));

    const dataRows = rawData.slice(1);
    let processedCount = 0;
    const errors = [];
    const insertedLeads = [];

    for (let rowIdx = 0; rowIdx < dataRows.length; rowIdx++) {
      const row = dataRows[rowIdx];
      if (!row || row.every(cell => cell === '' || cell === null || cell === undefined)) continue;

      try {
        const location = colIndex['location'] !== undefined ? (row[colIndex['location']] || '').toString().trim() : 'others';
        const model = colIndex['model'] !== undefined ? (row[colIndex['model']] || '').toString().trim() : '';
        const fullName = colIndex['full_name'] !== undefined ? (row[colIndex['full_name']] || '').toString().trim() : '';
        let phone = colIndex['phone_number'] !== undefined ? (row[colIndex['phone_number']] || '').toString().trim() : '';

        // Clean phone number (remove p:+ prefix etc.)
        phone = phone.replace(/^p:\+?/, '').replace(/[^0-9+]/g, '').trim();

        if (!fullName && !phone) continue; // Skip empty rows

        // Date from created_time column or use adjustDate
        let rawDate = createdTimeIdx >= 0 ? row[createdTimeIdx] : null;
        const adjustedDate = adjustLeadDate(rawDate, uploadDate);

        // Find dealer
        const dealer = await findDealerByDistrict(location);

        insertedLeads.push({
          lead_date: adjustedDate,
          full_name: fullName,
          location: location,
          model: model,
          phone_number: phone,
          dealer_id: dealer.id,
          dealer_name: dealer.dealer_name,
          upload_batch_id: batchId,
          status: 'In Progress'
        });
        processedCount++;
      } catch (rowErr) {
        errors.push(`Row ${rowIdx + 2}: ${rowErr.message}`);
      }
    }

    // Bulk insert leads
    if (insertedLeads.length > 0) {
      const values = insertedLeads.map(l => [
        l.lead_date, l.full_name, l.location, l.model, l.phone_number,
        l.dealer_id, l.dealer_name, l.upload_batch_id, l.status
      ]);
      await db.query(
        `INSERT INTO leads (lead_date, full_name, location, model, phone_number, dealer_id, dealer_name, upload_batch_id, status) VALUES ?`,
        [values]
      );
    }

    // Update batch record
    await db.query(
      `UPDATE upload_batches SET status='completed', total_records=?, processed_records=?, error_log=? WHERE id=?`,
      [dataRows.length, processedCount, errors.length > 0 ? errors.slice(0, 10).join('; ') : null, batchId]
    );

    res.json({
      success: true,
      message: `Upload successful: ${processedCount} leads processed`,
      data: {
        batch_id: batchId,
        total_rows: dataRows.length,
        processed: processedCount,
        errors: errors.slice(0, 5)
      }
    });

  } catch (err) {
    console.error('Upload error:', err);
    if (batchId) {
      await db.query(`UPDATE upload_batches SET status='failed', error_log=? WHERE id=?`, [err.message, batchId]);
    }
    res.status(500).json({ success: false, message: 'Upload processing failed: ' + err.message });
  }
});

// GET /api/upload/batches - Get upload history
router.get('/batches', authenticate, authorize('admin', 'campaign_team'), async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT ub.*, u.full_name as uploaded_by_name 
       FROM upload_batches ub 
       LEFT JOIN users u ON ub.uploaded_by = u.id 
       ORDER BY ub.created_at DESC 
       LIMIT 50`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
