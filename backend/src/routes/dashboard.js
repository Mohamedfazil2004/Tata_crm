const express = require('express');
const db = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const router = express.Router();

// GET /api/dashboard/admin - Full admin dashboard analytics
router.get('/admin', authenticate, authorize('admin', 'campaign_team'), async (req, res) => {
  try {
    const { date_from, date_to } = req.query;
    let baseWhere = '1=1';
    let params = [];

    if (date_from && date_to) {
      baseWhere = 'lead_date BETWEEN ? AND ?';
      params.push(date_from, date_to);
    }

    // Total leads
    const [[totals]] = await db.query(`
      SELECT 
        COUNT(*) as total_leads,
        COUNT(CASE WHEN status='Completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status='In Progress' THEN 1 END) as pending_leads,
        (SELECT COUNT(*) FROM leads WHERE follow_up_date IS NOT NULL AND follow_up_date >= CURDATE() AND status != 'Completed') as pending_followups
      FROM leads
      WHERE ${baseWhere}
    `, params);

    // Status distribution for pie chart
    const [statusDist] = await db.query(`
      SELECT status, COUNT(*) as count FROM leads WHERE ${baseWhere} GROUP BY status
    `, params);

    // Remark distribution (Telecaller Remarks)
    const [remarkDist] = await db.query(`
      SELECT telecaller_remark as status, COUNT(*) as count 
      FROM leads 
      WHERE ${baseWhere} AND telecaller_remark IS NOT NULL AND telecaller_remark != ''
      GROUP BY telecaller_remark
    `, params);

    // Dealer performance
    const [dealerPerf] = await db.query(`
      SELECT 
        d.dealer_name,
        COUNT(l.id) as total_leads,
        COUNT(CASE WHEN l.status='Completed' THEN 1 END) as completed,
        COUNT(CASE WHEN l.follow_up_date IS NOT NULL AND l.follow_up_date <= CURDATE() AND l.status != 'Completed' THEN 1 END) as pending,
        ROUND(COUNT(CASE WHEN l.status='Completed' THEN 1 END) * 100.0 / NULLIF(COUNT(l.id), 0), 1) as conversion_rate
      FROM dealers d
      LEFT JOIN leads l ON d.id = l.dealer_id AND (l.lead_date BETWEEN ? AND ?)
      WHERE d.dealer_name != 'Others'
      GROUP BY d.id, d.dealer_name
      ORDER BY total_leads DESC
    `, [date_from || '2000-01-01', date_to || '2099-12-31']);

    // Daily leads trend (last 30 days or selected range)
    let trendWhere = baseWhere;
    let trendParams = [...params];
    if (!date_from || !date_to) {
      trendWhere = 'lead_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
      trendParams = [];
    }

    const [dailyTrend] = await db.query(`
      SELECT 
        DATE_FORMAT(lead_date, '%d %b') as date_label,
        lead_date,
        COUNT(*) as count
      FROM leads 
      WHERE ${trendWhere}
      GROUP BY lead_date
      ORDER BY lead_date ASC
    `, trendParams);

    // Model distribution
    const [modelDist] = await db.query(`
      SELECT model, COUNT(*) as count FROM leads 
      WHERE ${baseWhere} AND model IS NOT NULL AND model != ''
      GROUP BY model ORDER BY count DESC LIMIT 10
    `, params);

    // Campaign metrics
    let campaignWhere = '1=1';
    let campaignParams = [];
    if (date_from && date_to) {
      campaignWhere = 'metric_date BETWEEN ? AND ?';
      campaignParams.push(date_from, date_to);
    }
    const [campaignMetrics] = await db.query(`
      SELECT 
        metric_date, 
        DATE_FORMAT(metric_date, '%d %b') as date_label,
        total_leads, 
        ad_spend
      FROM campaign_metrics 
      WHERE ${campaignWhere}
      ORDER BY metric_date DESC 
      LIMIT 30
    `, campaignParams);

    // Recent activity
    const [recentLeads] = await db.query(`
      SELECT l.id, l.full_name, l.location, l.model, l.status, l.updated_at, d.dealer_name
      FROM leads l
      LEFT JOIN dealers d ON l.dealer_id = d.id
      WHERE ${baseWhere}
      ORDER BY l.updated_at DESC
      LIMIT 10
    `, params);

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
        remark_distribution: remarkDist,
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
router.get('/dealer', authenticate, authorize('dealer', 'dse'), async (req, res) => {
  try {
    const { date_from, date_to } = req.query;
    let baseWhere = '1=1';
    let params = [];
    const isDSE = req.user.role === 'dse';
    const statusCol = isDSE ? 'dse_status' : 'status';

    if (req.user.role === 'dealer') {
      baseWhere = 'dealer_id = ?';
      params.push(req.user.dealer_id);
    } else if (isDSE) {
      baseWhere = 'assigned_to_dse = ?';
      params.push(req.user.full_name);
    }

    // Date filtering if provided
    let dateWhere = baseWhere;
    let dateParams = [...params];
    if (date_from && date_to) {
      dateWhere += ' AND lead_date BETWEEN ? AND ?';
      dateParams.push(date_from, date_to);
    }

    // DSE follow-up rule: "Only leads with a Follow-up Date entered by the DSE should appear"
    let followupCondition = 'follow_up_date BETWEEN ? AND ?';
    if (isDSE) followupCondition += ' AND last_updated_by = "DSE"';

    const summaryParams = [
      date_from || '2000-01-01', date_to || '2099-12-31',
      ...dateParams
    ];
    const [[summary]] = await db.query(`
      SELECT 
        COUNT(*) as total_leads,
        COUNT(CASE WHEN ${statusCol}='In Progress' THEN 1 END) as pending_leads,
        COUNT(CASE WHEN ${statusCol}='Completed' THEN 1 END) as completed,
        COUNT(CASE WHEN ${followupCondition} THEN 1 END) as total_followups
      FROM (SELECT * FROM leads WHERE ${dateWhere}) as sub`, summaryParams);

    // Status distribution
    const [statusDist] = await db.query(`
      SELECT ${statusCol} as status, COUNT(*) as count FROM leads WHERE ${dateWhere} GROUP BY ${statusCol}
    `, dateParams);

    // Remark distribution (Telecaller Remarks)
    const [remarkDist] = await db.query(`
      SELECT telecaller_remark as name, COUNT(*) as value 
      FROM leads 
      WHERE ${dateWhere} AND telecaller_remark IS NOT NULL AND telecaller_remark != ''
      GROUP BY telecaller_remark
    `, dateParams);

    // Deal Stage distribution
    const [stageDist] = await db.query(`
      SELECT deal_stage as name, COUNT(*) as value 
      FROM leads 
      WHERE ${dateWhere} AND deal_stage IS NOT NULL AND deal_stage != '' AND deal_stage != 'New'
      GROUP BY deal_stage
    `, dateParams);

    // If dealer, get distribution per DSE
    let dseStageDist = [];
    if (req.user.role === 'dealer') {      const [dseDist] = await db.query(`
        SELECT assigned_to_dse as dse_name, deal_stage as stage, COUNT(*) as count
        FROM leads
        WHERE ${dateWhere} 
          AND assigned_to_dse IS NOT NULL AND assigned_to_dse != '' 
          AND deal_stage IS NOT NULL AND deal_stage != '' AND deal_stage != 'New'
        GROUP BY assigned_to_dse, deal_stage
      `, dateParams);
      
      // Transform to grouped format
      const grouped = dseDist.reduce((acc, curr) => {
        if (!acc[curr.dse_name]) acc[curr.dse_name] = [];
        acc[curr.dse_name].push({ name: curr.stage, value: curr.count });
        return acc;
      }, {});
      dseStageDist = Object.entries(grouped).map(([name, dist]) => ({ dse_name: name, distribution: dist }));
    }

    const conversionRate = summary.total_leads > 0
      ? Math.round((summary.completed / summary.total_leads) * 100)
      : 0;

    res.json({
      success: true,
      data: {
        summary: { ...summary, conversion_rate: conversionRate },
        status_distribution: statusDist,
        remark_distribution: remarkDist,
        deal_stage_distribution: stageDist,
        dse_stage_distribution: dseStageDist
      }
    });
  } catch (err) {
    console.error('Dealer dashboard error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
