const express = require('express');
const pool = require('../db/pool');
const { z } = require('zod');

const router = express.Router();

// GET /api/devices — list all devices with filters
router.get('/', async (req, res, next) => {
  try {
    const { status, os, search } = req.query;
    
    let sql = `SELECT * FROM devices WHERE 1=1`;
    const params = [];

    if (status) {
      sql += ` AND status = ?`;
      params.push(status);
    }
    if (os) {
      sql += ` AND os = ?`;
      params.push(os);
    }
    if (search) {
      sql += ` AND (model LIKE ? OR manufacturer LIKE ? OR asset_tag LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    sql += ` ORDER BY created_at DESC`;

    const [devices] = await pool.query(sql, params);
    res.json(devices);
  } catch (err) {
    next(err);
  }
});

// GET /api/devices/:id — device details + health issues + reservations
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const [devices] = await pool.query(`SELECT * FROM devices WHERE id = ?`, [id]);
    if (devices.length === 0) {
      return res.status(404).json({ error: 'Device not found' });
    }
    const device = devices[0];

    // Get unresolved blocking issues
    const [blockingIssues] = await pool.query(
      `SELECT * FROM health_logs 
       WHERE device_id = ? AND resolved = 0 AND severity = 'blocking'
       ORDER BY reported_at DESC`,
      [id]
    );

    // Get all health logs
    const [healthLogs] = await pool.query(
      `SELECT * FROM health_logs WHERE device_id = ? ORDER BY reported_at DESC LIMIT 10`,
      [id]
    );

    // Get upcoming approved reservations
    const [upcomingReservations] = await pool.query(
      `SELECT * FROM reservations 
       WHERE device_id = ? AND status IN ('approved', 'active')
       AND reserve_to >= CURDATE()
       ORDER BY reserve_from ASC`,
      [id]
    );

    res.json({
      device,
      blockingIssues,
      healthLogs,
      upcomingReservations
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
