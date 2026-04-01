const express = require('express');
const db = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const router = express.Router();

// MULTER SETUP FOR PHOTO UPLOADS
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../uploads/jio-tags');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `jio_${req.params.id}_${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Invalid format: only JPG/PNG are allowed'));
  }
});

// GET /api/leads - Get leads (filtered by role)
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 50, search = '', status = '', date_from = '', date_to = '', dealer_id = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = ['1=1'];
    let params = [];

    // Dealers only see their own leads
    if (req.user.role === 'dealer') {
      where.push('l.dealer_id = ?');
      params.push(req.user.dealer_id);
    } else if (req.user.role === 'dse') {
      // DSE only see leads assigned to them
      where.push('l.assigned_to_dse = ?');
      params.push(req.user.full_name);
    } else if (dealer_id) {
      where.push('l.dealer_id = ?');
      params.push(dealer_id);
    }

    if (search) {
      where.push('(l.full_name LIKE ? OR l.phone_number LIKE ? OR l.location LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (status) {
      where.push('l.status = ?');
      params.push(status);
    }
    if (date_from && date_to) {
      where.push('(l.lead_date BETWEEN ? AND ? OR l.follow_up_date BETWEEN ? AND ? OR (l.follow_up_date IS NOT NULL AND l.status != "Completed"))');
      params.push(date_from, date_to, date_from, date_to);
    } else if (date_from) {
      where.push('(l.lead_date >= ? OR l.follow_up_date >= ? OR (l.follow_up_date IS NOT NULL AND l.status != "Completed"))');
      params.push(date_from, date_from);
    } else if (date_to) {
      where.push('(l.lead_date <= ? OR l.follow_up_date <= ? OR (l.follow_up_date IS NOT NULL AND l.status != "Completed"))');
      params.push(date_to, date_to);
    }

    const whereStr = where.join(' AND ');

    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM leads l WHERE ${whereStr}`,
      params
    );
    const total = countResult[0].total;

    const [leads] = await db.query(
      `SELECT l.*, d.dealer_name as dealer_display_name 
       FROM leads l 
       LEFT JOIN dealers d ON l.dealer_id = d.id 
       WHERE ${whereStr} 
       ORDER BY 
         (status = 'Completed') ASC,
         (CASE WHEN follow_up_date < CURDATE() THEN 0 
               WHEN follow_up_date = CURDATE() THEN 1 
               WHEN follow_up_date IS NULL THEN 2
               ELSE 3 END) ASC,
         follow_up_date ASC,
         lead_date DESC 
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    res.json({
      success: true,
      data: leads,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        total_pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('Get leads error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/leads/:id - Get single lead
router.get('/:id', authenticate, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT l.*, d.dealer_name as dealer_display_name 
       FROM leads l 
       LEFT JOIN dealers d ON l.dealer_id = d.id 
       WHERE l.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Lead not found' });

    // Permissions
    if (req.user.role === 'dealer' && rows[0].dealer_id !== req.user.dealer_id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    if (req.user.role === 'dse' && rows[0].assigned_to_dse !== req.user.full_name) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/leads/:id - Update lead
router.put('/:id', authenticate, upload.single('jio_tag_photo'), async (req, res) => {
  try {
    const { 
      follow_up_date, dse_follow_up_date, telecaller_remark, status, assigned_to_dse,
      visit_status, interest_level, deal_stage, expected_purchase_timeline, budget, customer_response, lost_reason,
      customer_appointment_date, customer_location
    } = req.body;

    // Check lead exists and permission
    const [rows] = await db.query('SELECT * FROM leads WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Lead not found' });

    if (req.user.role === 'dealer' && rows[0].dealer_id !== req.user.dealer_id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    if (req.user.role === 'dse' && rows[0].assigned_to_dse !== req.user.full_name) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const updateFields = {};
    if (follow_up_date !== undefined) {
      const today = new Date().toISOString().split('T')[0];
      const newDate = follow_up_date ? follow_up_date.split('T')[0] : null;
      const oldDate = rows[0].follow_up_date ? new Date(rows[0].follow_up_date).toISOString().split('T')[0] : null;
      
      if (newDate && status !== 'Completed' && newDate !== oldDate) {
        if (newDate < today) {
          return res.status(400).json({ success: false, message: 'Follow-up date cannot be in the past' });
        }
      }
      updateFields.follow_up_date = newDate;
    }
    
    // Core fields
    if (telecaller_remark !== undefined) updateFields.telecaller_remark = telecaller_remark;
    
    // Dealer Status (Only update status via Dealer role or API if not DSE)
    if (req.user.role === 'dealer' && status !== undefined) {
      updateFields.status = status;
    }

    if (assigned_to_dse !== undefined) {
        updateFields.assigned_to_dse = assigned_to_dse;
        // Optionally reset dse_status to In Progress when reassigning? User said:
        // "When a new lead is assigned to a DSE... default status must always be In Progress"
        updateFields.dse_status = 'In Progress'; 
    }

    if (customer_appointment_date !== undefined) updateFields.customer_appointment_date = customer_appointment_date || null;
    if (customer_location !== undefined) updateFields.customer_location = customer_location;
    
    // DSE fields & Logic
    if (req.user.role === 'dse') {
      updateFields.last_updated_by = 'DSE';
      
      // RULE: "The lead status should remain In Progress until the DSE submits the Activity Log form. 
      // Only after the DSE fills the Activity Log form and submits it, the lead status should change to Completed in the DSE page."
      // Since any PUT from DSE role is an "Activity Log submission":
      updateFields.dse_status = 'Completed'; 

      if (visit_status !== undefined) updateFields.visit_status = visit_status;
      if (interest_level !== undefined) updateFields.interest_level = interest_level;
      if (deal_stage !== undefined) {
        updateFields.deal_stage = deal_stage;
        // Note: Booking Done still marks the MASTER status as Completed?
        // Let's keep master status for Dealer.
        if (deal_stage === 'Booking Done') updateFields.status = 'Completed';
        if (deal_stage === 'Lost') updateFields.lost_reason = lost_reason;
      }
      if (expected_purchase_timeline !== undefined) updateFields.expected_purchase_timeline = expected_purchase_timeline;
      if (budget !== undefined) updateFields.budget = (budget === '' || budget === null) ? null : budget;
      if (customer_response !== undefined) updateFields.customer_response = customer_response;
      if (dse_follow_up_date !== undefined) updateFields.dse_follow_up_date = dse_follow_up_date || null;
    } else if (req.user.role === 'dealer') {
      updateFields.last_updated_by = 'Telecaller';
    }

    // Jio Tag Photo handle
    if (req.file) {
      updateFields.jio_tag_photo = `/uploads/jio-tags/${req.file.filename}`;
    }

    
    // Auto-increment follow_up_count
    if (status || telecaller_remark || assigned_to_dse || visit_status || deal_stage) {
      updateFields.follow_up_count = (rows[0].follow_up_count || 0) + 1;
      updateFields.last_contacted_date = new Date();
    }

    // Admin-only: Allow reassignment
    if (req.user.role === 'admin' && req.body.dealer_id !== undefined) {
      const dealerId = req.body.dealer_id;
      updateFields.dealer_id = dealerId;
      if (dealerId) {
        const [dealerRows] = await db.query('SELECT dealer_name FROM dealers WHERE id = ?', [dealerId]);
        if (dealerRows.length > 0) updateFields.dealer_name = dealerRows[0].dealer_name;
      }
    }

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    const setClause = Object.keys(updateFields).map(k => `${k} = ?`).join(', ');
    const values = [...Object.values(updateFields), req.params.id];

    await db.query(`UPDATE leads SET ${setClause} WHERE id = ?`, values);

    res.json({ success: true, message: 'Lead updated successfully' });
  } catch (err) {
    console.error('DSE/Dealer update error:', err);
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
});

// GET /api/leads/stats/summary - Summary stats
router.get('/stats/summary', authenticate, async (req, res) => {
  try {
    let where = ['1=1'];
    let params = [];

    if (req.user.role === 'dealer') {
      where.push('dealer_id = ?');
      params.push(req.user.dealer_id);
    } else if (req.user.role === 'dse') {
      where.push('assigned_to_dse = ?');
      params.push(req.user.full_name);
    }

    const whereStr = where.join(' AND ');

    const [total] = await db.query(`SELECT COUNT(*) as count FROM leads WHERE ${whereStr}`, params);
    const [pending] = await db.query(`SELECT COUNT(*) as count FROM leads WHERE ${whereStr} AND (follow_up_date IS NOT NULL AND follow_up_date <= CURDATE() AND status != 'Completed')`, params);
    const [completed] = await db.query(`SELECT COUNT(*) as count FROM leads WHERE ${whereStr} AND status = 'Completed'`, params);
    const [inProgress] = await db.query(`SELECT COUNT(*) as count FROM leads WHERE ${whereStr} AND status = 'In Progress'`, params);
    const [onCall] = await db.query(`SELECT COUNT(*) as count FROM leads WHERE ${whereStr} AND status = 'On Call'`, params);

    res.json({
      success: true,
      data: {
        total_leads: total[0].count,
        pending_followups: pending[0].count,
        completed: completed[0].count,
        in_progress: inProgress[0].count,
        on_call: onCall[0].count
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;

module.exports = router;
