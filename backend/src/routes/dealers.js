const express = require('express');
const db = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const router = express.Router();

// GET /api/dealers - List all dealers
router.get('/', authenticate, async (req, res) => {
  try {
    const [dealers] = await db.query(`
      SELECT d.*, 
        COUNT(DISTINCT u.id) as user_count,
        COUNT(DISTINCT l.id) as total_leads,
        COUNT(DISTINCT CASE WHEN l.status='Completed' THEN l.id END) as completed_leads,
        COUNT(DISTINCT CASE WHEN l.status!='Completed' THEN l.id END) as pending_leads,
        COUNT(DISTINCT CASE WHEN l.follow_up_date = CURDATE() AND l.status!='Completed' THEN l.id END) as today_followups,
        COUNT(DISTINCT CASE WHEN l.follow_up_date > CURDATE() AND l.status!='Completed' THEN l.id END) as upcoming_followups,
        COUNT(DISTINCT CASE WHEN l.follow_up_date < CURDATE() AND l.status!='Completed' THEN l.id END) as overdue_followups,
        MAX(l.follow_up_date) as last_followup
      FROM dealers d
      LEFT JOIN users u ON d.id = u.dealer_id
      LEFT JOIN leads l ON d.id = l.dealer_id
      GROUP BY d.id
      ORDER BY (d.dealer_name = 'Others') ASC, d.dealer_name ASC
    `);

    // Fetch remarks distribution for each dealer for the pie charts
    const [remarksData] = await db.query(`
      SELECT dealer_id, telecaller_remark, COUNT(*) as count 
      FROM leads 
      WHERE telecaller_remark IS NOT NULL AND telecaller_remark != ''
      GROUP BY dealer_id, telecaller_remark
    `);

    const result = dealers.map(d => {
      const dealerRemarks = remarksData
        .filter(r => r.dealer_id === d.id)
        .map(r => ({ label: r.telecaller_remark, value: r.count }));
      return { ...d, remarks_distribution: dealerRemarks };
    });

    res.json({ success: true, data: result });
  } catch (err) {
    console.error('Dealers API error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/dealers/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const [rows] = await db.query(`SELECT * FROM dealers WHERE id = ?`, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Dealer not found' });

    // Get districts
    const [districts] = await db.query(
      `SELECT dealer_district as district FROM district_dealer_mapping WHERE dealer_id = ?`,
      [req.params.id]
    );

    res.json({ success: true, data: { ...rows[0], districts } });
  } catch (err) {
    console.error('Fetch dealer details error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/dealers/:id/leads - Get leads for a specific dealer
router.get('/:id/leads', authenticate, async (req, res) => {
  try {
    const dealerId = req.params.id;

    // Dealers can only see their own
    if (req.user.role === 'dealer' && req.user.dealer_id != dealerId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const [leads] = await db.query(
      `SELECT * FROM leads WHERE dealer_id = ? ORDER BY lead_date DESC, id DESC LIMIT ? OFFSET ?`,
      [dealerId, parseInt(limit), offset]
    );
    const [count] = await db.query(`SELECT COUNT(*) as total FROM leads WHERE dealer_id = ?`, [dealerId]);

    res.json({
      success: true,
      data: leads,
      pagination: { total: count[0].total, page: parseInt(page), limit: parseInt(limit) }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/dealers/:id - Update dealer info (admin only)
router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { dealer_name, contact_person, phone, email } = req.body;
    await db.query(
      `UPDATE dealers SET dealer_name=?, contact_person=?, phone=?, email=? WHERE id=?`,
      [dealer_name, contact_person, phone, email, req.params.id]
    );
    res.json({ success: true, message: 'Dealer updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/dealers/:id/users - Get users for a dealer
router.get('/:id/users', authenticate, authorize('admin'), async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, username, email, full_name, is_active, created_at FROM users WHERE dealer_id = ?`,
      [req.params.id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
