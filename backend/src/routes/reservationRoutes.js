const express = require('express');
const pool = require('../db/pool');
const { logEvent } = require('../services/auditService');
const { z } = require('zod');

const router = express.Router();

const createReservationSchema = z.object({
  device_id: z.number().int().positive(),
  requester_name: z.string().min(1).max(120),
  requester_email: z.string().email().max(160),
  purpose: z.string().min(1),
  reserve_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reserve_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

// POST /api/reservations — request a reservation
router.post('/', async (req, res, next) => {
  try {
    const data = createReservationSchema.parse(req.body);

    // Validate date range
    if (data.reserve_from >= data.reserve_to) {
      return res.status(400).json({ error: 'reserve_to must be after reserve_from' });
    }

    // Check device exists
    const [devices] = await pool.query(
      `SELECT id FROM devices WHERE id = ?`,
      [data.device_id]
    );
    if (devices.length === 0) {
      return res.status(404).json({ error: 'Device not found' });
    }

    // Check for overlapping approved/active reservations
    const [overlaps] = await pool.query(
      `SELECT COUNT(*) as count FROM reservations
       WHERE device_id = ? 
       AND status IN ('approved', 'active')
       AND NOT (reserve_to < ? OR reserve_from > ?)`,
      [data.device_id, data.reserve_from, data.reserve_to]
    );
    if (overlaps[0].count > 0) {
      return res.status(400).json({ 
        error: 'Device has overlapping reservations for this date range' 
      });
    }

    const [result] = await pool.query(
      `INSERT INTO reservations 
       (device_id, requester_name, requester_email, purpose, reserve_from, reserve_to)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [data.device_id, data.requester_name, data.requester_email, data.purpose, 
       data.reserve_from, data.reserve_to]
    );

    await logEvent({
      eventType: 'reservation_requested',
      deviceId: data.device_id,
      actorName: data.requester_name,
      actorEmail: data.requester_email,
      details: { reservationId: result.insertId, dates: `${data.reserve_from} to ${data.reserve_to}` }
    });

    res.status(201).json({ id: result.insertId, status: 'pending' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
