const express = require('express');
const pool = require('../db/pool');
const { logEvent } = require('../services/auditService');
const { z } = require('zod');

const router = express.Router();

const joinWaitlistSchema = z.object({
  device_id: z.number().int().positive(),
  requester_name: z.string().min(1).max(120),
  requester_email: z.string().email().max(160),
  purpose: z.string().min(1),
});

// POST /api/waitlist — join waitlist
router.post('/', async (req, res, next) => {
  try {
    const data = joinWaitlistSchema.parse(req.body);

    // Check device exists
    const [devices] = await pool.query(
      `SELECT id FROM devices WHERE id = ?`,
      [data.device_id]
    );
    if (devices.length === 0) {
      return res.status(404).json({ error: 'Device not found' });
    }

    // Get next position
    const [counts] = await pool.query(
      `SELECT COALESCE(MAX(position), 0) + 1 as next_position 
       FROM waitlist 
       WHERE device_id = ? AND status = 'waiting'`,
      [data.device_id]
    );
    const position = counts[0].next_position;

    const [result] = await pool.query(
      `INSERT INTO waitlist 
       (device_id, requester_name, requester_email, purpose, position)
       VALUES (?, ?, ?, ?, ?)`,
      [data.device_id, data.requester_name, data.requester_email, data.purpose, position]
    );

    await logEvent({
      eventType: 'waitlist_joined',
      deviceId: data.device_id,
      actorName: data.requester_name,
      actorEmail: data.requester_email,
      details: { waitlistId: result.insertId, position }
    });

    res.status(201).json({ id: result.insertId, position, status: 'waiting' });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/waitlist/:id — leave waitlist
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { requester_email } = req.query;

    if (!requester_email) {
      return res.status(400).json({ error: 'requester_email query param required' });
    }

    const [entries] = await pool.query(
      `SELECT * FROM waitlist WHERE id = ?`,
      [id]
    );
    if (entries.length === 0) {
      return res.status(404).json({ error: 'Waitlist entry not found' });
    }

    if (entries[0].requester_email !== requester_email) {
      return res.status(403).json({ error: 'Not authorized to cancel this entry' });
    }

    await pool.query(
      `UPDATE waitlist SET status = 'cancelled' WHERE id = ?`,
      [id]
    );

    await logEvent({
      eventType: 'waitlist_cancelled',
      deviceId: entries[0].device_id,
      actorName: entries[0].requester_name,
      actorEmail: entries[0].requester_email,
      details: { waitlistId: id }
    });

    res.json({ status: 'cancelled' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
