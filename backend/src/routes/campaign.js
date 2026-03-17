const express = require('express');
const db = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const router = express.Router();

// GET /api/campaign/metrics - List campaign metrics
router.get('/metrics', authenticate, authorize('admin', 'campaign_team'), async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT cm.*, u.full_name as entered_by_name
      FROM campaign_metrics cm
      LEFT JOIN users u ON cm.entered_by = u.id
      ORDER BY cm.metric_date DESC
      LIMIT 60
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/campaign/metrics - Add/update campaign metric
router.post('/metrics', authenticate, authorize('admin', 'campaign_team'), async (req, res) => {
  try {
    const { metric_date, total_leads, ad_spend } = req.body;
    if (!metric_date) return res.status(400).json({ success: false, message: 'Date is required' });

    await db.query(`
      INSERT INTO campaign_metrics (metric_date, total_leads, ad_spend, entered_by)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE total_leads=VALUES(total_leads), ad_spend=VALUES(ad_spend), entered_by=VALUES(entered_by)
    `, [metric_date, total_leads || 0, ad_spend || 0, req.user.id]);

    res.json({ success: true, message: 'Campaign metrics saved' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/campaign/metrics/:date
router.delete('/metrics/:date', authenticate, authorize('admin'), async (req, res) => {
  try {
    await db.query('DELETE FROM campaign_metrics WHERE metric_date = ?', [req.params.date]);
    res.json({ success: true, message: 'Metric deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
