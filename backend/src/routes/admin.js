const express = require('express');
const db = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const fs = require('fs');
const path = require('path');
const router = express.Router();

/**
 * DELETE /api/admin/clear-all
 * DANGEROUS: Clears all leads, upload batches, campaign metrics, and uploaded files.
 * Restricted to: admin
 */
router.delete('/clear-all', authenticate, authorize('admin'), async (req, res) => {
  try {
    // 1. Clear Leads
    await db.query('DELETE FROM leads');
    await db.query('ALTER TABLE leads AUTO_INCREMENT = 1');

    // 2. Clear Upload Batches
    await db.query('DELETE FROM upload_batches');
    await db.query('ALTER TABLE upload_batches AUTO_INCREMENT = 1');

    // 3. Clear Campaign Metrics
    await db.query('DELETE FROM campaign_metrics');
    await db.query('ALTER TABLE campaign_metrics AUTO_INCREMENT = 1');

    // 4. Clear Upload Files
    const uploadsDir = path.join(__dirname, '../../uploads');
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      for (const file of files) {
        const filePath = path.join(uploadsDir, file);
        if (fs.lstatSync(filePath).isFile()) {
          fs.unlinkSync(filePath);
        }
      }
    }

    // 5. Clear Jio Tags
    const jioTagsDir = path.join(uploadsDir, 'jio-tags');
    if (fs.existsSync(jioTagsDir)) {
      const files = fs.readdirSync(jioTagsDir);
      for (const file of files) {
        const filePath = path.join(jioTagsDir, file);
        if (fs.lstatSync(filePath).isFile()) {
          fs.unlinkSync(filePath);
        }
      }
    }

    res.json({ 
      success: true, 
      message: 'All leads, batches, campaign metrics, and files have been cleared successfully.' 
    });
  } catch (err) {
    console.error('Clear All Error:', err);
    res.status(500).json({ success: false, message: 'Failed to clear data: ' + err.message });
  }
});

module.exports = router;
