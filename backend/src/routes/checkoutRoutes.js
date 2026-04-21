const express = require('express');
const pool = require('../db/pool');
const { logEvent } = require('../services/auditService');
const { z } = require('zod');

const router = express.Router();

const createCheckoutSchema = z.object({
  device_id: z.number().int().positive(),
  requester_name: z.string().min(1).max(120),
  requester_email: z.string().email().max(160),
  purpose: z.string().min(1),
  expected_return_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

// POST /api/checkout-requests — submit a checkout request
router.post('/', async (req, res, next) => {
  try {
    const data = createCheckoutSchema.parse(req.body);

    // Check device exists and is available
    const [devices] = await pool.query(
      `SELECT id, status FROM devices WHERE id = ?`,
      [data.device_id]
    );
    if (devices.length === 0) {
      return res.status(404).json({ error: 'Device not found' });
    }
    if (devices[0].status !== 'available') {
      return res.status(400).json({ 
        error: 'Device is not available. Try reserving or joining the waitlist instead.' 
      });
    }

    // Check for blocking health issues
    const [blockingIssues] = await pool.query(
      `SELECT COUNT(*) as count FROM health_logs 
       WHERE device_id = ? AND resolved = 0 AND severity = 'blocking'`,
      [data.device_id]
    );
    if (blockingIssues[0].count > 0) {
      return res.status(400).json({ 
        error: 'Device has unresolved blocking issues and cannot be checked out.' 
      });
    }

    const [result] = await pool.query(
      `INSERT INTO checkout_requests 
       (device_id, requester_name, requester_email, purpose, expected_return_date)
       VALUES (?, ?, ?, ?, ?)`,
      [data.device_id, data.requester_name, data.requester_email, data.purpose, data.expected_return_date]
    );

    await logEvent({
      eventType: 'checkout_requested',
      deviceId: data.device_id,
      actorName: data.requester_name,
      actorEmail: data.requester_email,
      details: { requestId: result.insertId, purpose: data.purpose }
    });

    res.status(201).json({ id: result.insertId, status: 'pending' });
  } catch (err) {
    next(err);
  }
});

// POST /api/checkout-requests/:id/request-return — requester initiates return
router.post('/:id/request-return', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { requester_email } = req.body;

    if (!requester_email) {
      return res.status(400).json({ error: 'requester_email is required' });
    }

    const [requests] = await pool.query(
      `SELECT * FROM checkout_requests WHERE id = ?`,
      [id]
    );
    if (requests.length === 0) {
      return res.status(404).json({ error: 'Checkout request not found' });
    }

    const request = requests[0];
    if (request.requester_email !== requester_email) {
      return res.status(403).json({ error: 'Not authorized to return this device' });
    }
    if (request.status !== 'approved') {
      return res.status(400).json({ error: 'Only approved checkouts can be returned' });
    }

    await pool.query(
      `UPDATE checkout_requests 
       SET status = 'return_pending', return_requested_at = NOW()
       WHERE id = ?`,
      [id]
    );

    await logEvent({
      eventType: 'return_requested',
      deviceId: request.device_id,
      actorName: request.requester_name,
      actorEmail: request.requester_email,
      details: { requestId: id }
    });

    res.json({ status: 'return_pending' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
