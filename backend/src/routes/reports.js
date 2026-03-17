const express = require('express');
const db = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const router = express.Router();

// GET /api/reports/dealer-performance
router.get('/dealer-performance', authenticate, authorize('admin', 'campaign_team'), async (req, res) => {
  try {
    const { date_from, date_to } = req.query;
    let dateFilter = '';
    const params = [];

    if (date_from && date_to) {
      dateFilter = 'AND l.lead_date BETWEEN ? AND ?';
      params.push(date_from, date_to);
    }

    const [rows] = await db.query(`
      SELECT 
        d.id as dealer_id,
        d.dealer_name,
        COUNT(l.id) as total_leads,
        COUNT(CASE WHEN l.follow_up_date IS NOT NULL THEN 1 END) as leads_with_followup,
        COUNT(CASE WHEN l.status='Completed' THEN 1 END) as completed,
        COUNT(CASE WHEN l.status='In Progress' THEN 1 END) as in_progress,
        COUNT(CASE WHEN l.status='On Call' THEN 1 END) as on_call,
        COUNT(CASE WHEN l.follow_up_date < CURDATE() AND l.status != 'Completed' THEN 1 END) as overdue,
        ROUND(COUNT(CASE WHEN l.status='Completed' THEN 1 END) * 100.0 / NULLIF(COUNT(l.id), 0), 1) as conversion_rate
      FROM dealers d
      LEFT JOIN leads l ON d.id = l.dealer_id ${dateFilter}
      WHERE d.dealer_name != 'Others'
      GROUP BY d.id, d.dealer_name
      ORDER BY total_leads DESC
    `, params);

    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/reports/lead-status
router.get('/lead-status', authenticate, async (req, res) => {
  try {
    const { date_from, date_to } = req.query;
    let where = ['1=1'];
    const params = [];

    if (req.user.role === 'dealer') {
      where.push('dealer_id = ?');
      params.push(req.user.dealer_id);
    }
    if (date_from) { where.push('lead_date >= ?'); params.push(date_from); }
    if (date_to) { where.push('lead_date <= ?'); params.push(date_to); }

    const [rows] = await db.query(`
      SELECT status, COUNT(*) as count, 
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM leads WHERE ${where.join(' AND ')}), 1) as percentage
      FROM leads WHERE ${where.join(' AND ')}
      GROUP BY status
    `, [...params, ...params]);

    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/reports/daily-campaign
router.get('/daily-campaign', authenticate, authorize('admin', 'campaign_team'), async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        cm.metric_date,
        DATE_FORMAT(cm.metric_date, '%d %b %Y') as date_label,
        cm.total_leads as campaign_leads,
        cm.ad_spend,
        COUNT(l.id) as actual_leads,
        u.full_name as entered_by_name
      FROM campaign_metrics cm
      LEFT JOIN leads l ON DATE(l.lead_date) = cm.metric_date
      LEFT JOIN users u ON cm.entered_by = u.id
      GROUP BY cm.id, cm.metric_date, cm.total_leads, cm.ad_spend, u.full_name
      ORDER BY cm.metric_date DESC
      LIMIT 60
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/reports/followup-success
router.get('/followup-success', authenticate, async (req, res) => {
  try {
    let where = ['1=1'];
    const params = [];
    if (req.user.role === 'dealer') {
      where.push('l.dealer_id = ?');
      params.push(req.user.dealer_id);
    }

    const [rows] = await db.query(`
      SELECT 
        DATE_FORMAT(l.follow_up_date, '%Y-%m-%d') as followup_date,
        DATE_FORMAT(l.follow_up_date, '%d %b') as date_label,
        COUNT(*) as total_scheduled,
        COUNT(CASE WHEN l.status='Completed' THEN 1 END) as completed,
        COUNT(CASE WHEN l.status='On Call' THEN 1 END) as called,
        COUNT(CASE WHEN l.status='In Progress' THEN 1 END) as pending
      FROM leads l
      WHERE ${where.join(' AND ')} AND l.follow_up_date IS NOT NULL
      GROUP BY l.follow_up_date
      ORDER BY l.follow_up_date DESC
      LIMIT 30
    `, params);

    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
