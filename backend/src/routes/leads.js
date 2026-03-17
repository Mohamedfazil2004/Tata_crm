const express = require('express');
const db = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const router = express.Router();

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
    if (date_from) {
      where.push('l.lead_date >= ?');
      params.push(date_from);
    }
    if (date_to) {
      where.push('l.lead_date <= ?');
      params.push(date_to);
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
         (CASE WHEN priority = 'Hot' THEN 0 WHEN priority = 'Warm' THEN 1 ELSE 2 END) ASC,
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

    // Dealers can only view their own leads
    if (req.user.role === 'dealer' && rows[0].dealer_id !== req.user.dealer_id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/leads/:id - Update lead (dealers can update follow-up, voc, remarks, status)
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { follow_up_date, voice_of_customer, consolidated_remark, status } = req.body;

    // Validate: completed requires consolidated_remark
    if (status === 'Completed' && !consolidated_remark) {
      return res.status(400).json({ success: false, message: 'Consolidated remarks are required when status is Completed' });
    }

    // Check lead exists and permission
    const [rows] = await db.query('SELECT * FROM leads WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Lead not found' });

    if (req.user.role === 'dealer' && rows[0].dealer_id !== req.user.dealer_id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const updateFields = {};
    if (follow_up_date !== undefined) {
      const today = new Date().toISOString().split('T')[0];
      const newDate = follow_up_date ? follow_up_date.split('T')[0] : null;
      
      if (newDate && status !== 'Completed') {
        if (newDate < today) {
          return res.status(400).json({ success: false, message: 'Follow-up date cannot be in the past' });
        }
      }
      updateFields.follow_up_date = newDate;
    }
    if (voice_of_customer !== undefined) updateFields.voice_of_customer = voice_of_customer;
    if (consolidated_remark !== undefined) updateFields.consolidated_remark = consolidated_remark;
    if (status !== undefined) updateFields.status = status;
    if (req.body.priority !== undefined) updateFields.priority = req.body.priority;
    if (req.body.last_contacted_date !== undefined) updateFields.last_contacted_date = req.body.last_contacted_date;
    
    // Auto-increment follow_up_count if certain fields change
    if (status || voice_of_customer || consolidated_remark) {
      updateFields.follow_up_count = (rows[0].follow_up_count || 0) + 1;
      updateFields.last_contacted_date = new Date();
    }

    // Admin-only: Allow reassignment
    if (req.user.role === 'admin' && req.body.dealer_id !== undefined) {
      const dealerId = req.body.dealer_id;
      updateFields.dealer_id = dealerId;
      
      // Get dealer name and primary district for location update
      if (dealerId) {
        const [dealerRows] = await db.query('SELECT dealer_name FROM dealers WHERE id = ?', [dealerId]);
        if (dealerRows.length > 0) {
          updateFields.dealer_name = dealerRows[0].dealer_name;
        }

        // Also update location to the primary district of this dealer (smallest ID in mapping)
        const [districtRows] = await db.query(
          'SELECT district FROM district_dealer_mapping WHERE dealer_id = ? ORDER BY id ASC LIMIT 1', 
          [dealerId]
        );
        if (districtRows.length > 0) {
          // Capitalize the district name for better display
          const rawDist = districtRows[0].district;
          const formattedDist = rawDist.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
          updateFields.location = formattedDist;
        }
      } else {
        updateFields.dealer_name = null;
        updateFields.location = 'Others';
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
    console.error('Update lead error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/leads/stats/summary - Summary stats
router.get('/stats/summary', authenticate, async (req, res) => {
  try {
    let dealerFilter = '';
    let params = [];

    if (req.user.role === 'dealer') {
      dealerFilter = 'WHERE dealer_id = ?';
      params.push(req.user.dealer_id);
    }

    const [total] = await db.query(`SELECT COUNT(*) as count FROM leads ${dealerFilter}`, params);
    const [pending] = await db.query(`SELECT COUNT(*) as count FROM leads ${dealerFilter} ${dealerFilter ? 'AND' : 'WHERE'} (follow_up_date IS NOT NULL AND follow_up_date <= CURDATE() AND status != 'Completed')`, params);
    const [completed] = await db.query(`SELECT COUNT(*) as count FROM leads ${dealerFilter} ${dealerFilter ? 'AND' : 'WHERE'} status = 'Completed'`, params);
    const [inProgress] = await db.query(`SELECT COUNT(*) as count FROM leads ${dealerFilter} ${dealerFilter ? 'AND' : 'WHERE'} status = 'In Progress'`, params);
    const [onCall] = await db.query(`SELECT COUNT(*) as count FROM leads ${dealerFilter} ${dealerFilter ? 'AND' : 'WHERE'} status = 'On Call'`, params);

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
