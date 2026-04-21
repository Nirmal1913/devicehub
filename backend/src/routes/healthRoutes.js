const express = require('express');
const pool = require('../db/pool');
const { logEvent } = require('../services/auditService');
const { z } = require('zod');

const router = express.Router();

const reportIssueSchema = z.object({
  device_id: z.number().int().positive(),
  issue_type: z.enum(['screen', 'battery', 'charging_port', 'buttons', 'software', 'other']),
  severity: z.enum(['minor', 'major', 'blocking']),
  description: z.string().min(1),
  reported_by_name: z.string().min(1).max(120),
  reported_by_email: z.string().email().max(160),
});

// POST /api/health-logs — report an issue
router.post('/', async (req, res, next) => {
  try {
    const data = reportIssueSchema.parse(req.body);

    // Check device exists
    const [devices] = await pool.query(
      `SELECT id FROM devices WHERE id = ?`,
      [data.device_id]
    );
    if (devices.length === 0) {
      return res.status(404).json({ error: 'Device not found' });
    }

    const [result] = await pool.query(
      `INSERT INTO health_logs 
       (device_id, issue_type, severity, description, reported_by_name, reported_by_email)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [data.device_id, data.issue_type, data.severity, data.description, 
       data.reported_by_name, data.reported_by_email]
    );

    await logEvent({
      eventType: 'health_issue_reported',
      deviceId: data.device_id,
      actorName: data.reported_by_name,
      actorEmail: data.reported_by_email,
      details: { 
        healthLogId: result.insertId, 
        issueType: data.issue_type, 
        severity: data.severity 
      }
    });

    res.status(201).json({ id: result.insertId });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
