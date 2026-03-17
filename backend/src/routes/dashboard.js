const express = require('express');
const db = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const router = express.Router();

// GET /api/dashboard/admin - Full admin dashboard analytics
router.get('/admin', authenticate, authorize('admin', 'campaign_team'), async (req, res) => {
  try {
    // Total leads
    const [[totals]] = await db.query(`
      SELECT 
        COUNT(*) as total_leads,
        COUNT(CASE WHEN status='Completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status='In Progress' THEN 1 END) as in_progress,
        COUNT(CASE WHEN status='On Call' THEN 1 END) as on_call,
        COUNT(CASE WHEN follow_up_date IS NOT NULL AND status != 'Completed' THEN 1 END) as pending_followups
      FROM leads
    `);

    // Status distribution for pie chart
    const [statusDist] = await db.query(`
      SELECT status, COUNT(*) as count FROM leads GROUP BY status
    `);

    // Dealer performance
    const [dealerPerf] = await db.query(`
      SELECT 
        d.dealer_name,
        COUNT(l.id) as total_leads,
        COUNT(CASE WHEN l.status='Completed' THEN 1 END) as completed,
        COUNT(CASE WHEN l.follow_up_date IS NOT NULL AND l.follow_up_date <= CURDATE() AND l.status != 'Completed' THEN 1 END) as pending,
        ROUND(COUNT(CASE WHEN l.status='Completed' THEN 1 END) * 100.0 / NULLIF(COUNT(l.id), 0), 1) as conversion_rate
      FROM dealers d
      LEFT JOIN leads l ON d.id = l.dealer_id
      WHERE d.dealer_name != 'Others'
      GROUP BY d.id, d.dealer_name
      ORDER BY total_leads DESC
    `);

    // Daily leads trend (last 30 days)
    const [dailyTrend] = await db.query(`
      SELECT 
        DATE_FORMAT(lead_date, '%d %b') as date_label,
        lead_date,
        COUNT(*) as count
      FROM leads 
      WHERE lead_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      GROUP BY lead_date
      ORDER BY lead_date ASC
    `);

    // Model distribution
    const [modelDist] = await db.query(`
      SELECT model, COUNT(*) as count FROM leads 
      WHERE model IS NOT NULL AND model != ''
      GROUP BY model ORDER BY count DESC LIMIT 10
    `);

    // Campaign metrics (last 30 days)
    const [campaignMetrics] = await db.query(`
      SELECT 
        metric_date, 
        DATE_FORMAT(metric_date, '%d %b') as date_label,
        total_leads, 
        ad_spend
      FROM campaign_metrics 
      ORDER BY metric_date DESC 
      LIMIT 30
    `);

    // Recent activity
    const [recentLeads] = await db.query(`
      SELECT l.id, l.full_name, l.location, l.model, l.status, l.updated_at, d.dealer_name
      FROM leads l
      LEFT JOIN dealers d ON l.dealer_id = d.id
      WHERE l.updated_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      ORDER BY l.updated_at DESC
      LIMIT 10
    `);

    // Conversion rate
    const conversionRate = totals.total_leads > 0
      ? Math.round((totals.completed / totals.total_leads) * 100)
      : 0;

    res.json({
      success: true,
      data: {
        summary: {
          ...totals,
          deals_won: totals.completed,  // completed = deals won
          deals_lost: 0,                // we don't track lost separately
          conversion_rate: conversionRate
        },
        status_distribution: statusDist,
        dealer_performance: dealerPerf,
        daily_trend: dailyTrend,
        model_distribution: modelDist,
        campaign_metrics: campaignMetrics,
        recent_activity: recentLeads
      }
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/dashboard/dealer - Dealer/telecaller dashboard
router.get('/dealer', authenticate, authorize('dealer'), async (req, res) => {
  try {
    const dealerId = req.user.dealer_id;

    const [[summary]] = await db.query(`
      SELECT 
        COUNT(*) as total_leads,
        COUNT(CASE WHEN status='In Progress' THEN 1 END) as in_progress,
        COUNT(CASE WHEN status='On Call' THEN 1 END) as on_call,
        COUNT(CASE WHEN status='Completed' THEN 1 END) as completed,
        COUNT(CASE WHEN follow_up_date = CURDATE() THEN 1 END) as followups_today,
        COUNT(CASE WHEN follow_up_date < CURDATE() AND status != 'Completed' THEN 1 END) as overdue_followups
      FROM leads WHERE dealer_id = ?
    `, [dealerId]);

    // Status distribution
    const [statusDist] = await db.query(`
      SELECT status, COUNT(*) as count FROM leads WHERE dealer_id = ? GROUP BY status
    `, [dealerId]);

    // Today's follow-ups
    const [todayFollowups] = await db.query(`
      SELECT id, full_name, phone_number, model, location, follow_up_date, status, voice_of_customer
      FROM leads 
      WHERE dealer_id = ? AND follow_up_date = CURDATE() AND status != 'Completed'
      ORDER BY follow_up_date ASC
      LIMIT 10
    `, [dealerId]);

    // Model distribution for this dealer
    const [modelDist] = await db.query(`
      SELECT model, COUNT(*) as count FROM leads 
      WHERE dealer_id = ? AND model IS NOT NULL AND model != ''
      GROUP BY model ORDER BY count DESC LIMIT 8
    `, [dealerId]);

    // Recent activity
    const [recentActivity] = await db.query(`
      SELECT id, full_name, status, lead_date, updated_at, voice_of_customer
      FROM leads 
      WHERE dealer_id = ? AND updated_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      ORDER BY updated_at DESC LIMIT 5
    `, [dealerId]);

    const conversionRate = summary.total_leads > 0
      ? Math.round((summary.completed / summary.total_leads) * 100)
      : 0;

    res.json({
      success: true,
      data: {
        summary: { ...summary, conversion_rate: conversionRate },
        status_distribution: statusDist,
        todays_followups: todayFollowups,
        model_distribution: modelDist,
        recent_activity: recentActivity
      }
    });
  } catch (err) {
    console.error('Dealer dashboard error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
