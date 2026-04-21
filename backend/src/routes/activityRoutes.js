const express = require('express');
const pool = require('../db/pool');

const router = express.Router();

// GET /api/my-activity?email=... — show user's requests/reservations/waitlist
router.get('/', async (req, res, next) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: 'email query parameter required' });
    }

    const [checkouts] = await pool.query(
      `SELECT cr.*, d.model, d.manufacturer 
       FROM checkout_requests cr
       JOIN devices d ON cr.device_id = d.id
       WHERE cr.requester_email = ?
       ORDER BY cr.requested_at DESC
       LIMIT 20`,
      [email]
    );

    const [reservations] = await pool.query(
      `SELECT r.*, d.model, d.manufacturer
       FROM reservations r
       JOIN devices d ON r.device_id = d.id
       WHERE r.requester_email = ?
       ORDER BY r.requested_at DESC
       LIMIT 20`,
      [email]
    );

    const [waitlist] = await pool.query(
      `SELECT w.*, d.model, d.manufacturer
       FROM waitlist w
       JOIN devices d ON w.device_id = d.id
       WHERE w.requester_email = ?
       ORDER BY w.joined_at DESC
       LIMIT 20`,
      [email]
    );

    res.json({ checkouts, reservations, waitlist });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
