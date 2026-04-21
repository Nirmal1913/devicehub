const express = require('express');
const pool = require('../db/pool');
const { requireAdmin } = require('../middleware/auth');
const { logEvent } = require('../services/auditService');
const { sendEmail } = require('../services/emailService');
const { login } = require('../controllers/authController');
const { z } = require('zod');

const router = express.Router();

// POST /api/admin/login — admin authentication
router.post('/login', login);

// Apply auth to all routes below
router.use(requireAdmin);

// ---------- Pending approvals ----------

// GET /api/admin/pending — all pending items grouped
router.get('/pending', async (req, res, next) => {
  try {
    const [checkouts] = await pool.query(
      `SELECT cr.*, d.model, d.manufacturer, d.asset_tag
       FROM checkout_requests cr
       JOIN devices d ON cr.device_id = d.id
       WHERE cr.status = 'pending'
       ORDER BY cr.requested_at ASC`
    );

    const [returns] = await pool.query(
      `SELECT cr.*, d.model, d.manufacturer, d.asset_tag
       FROM checkout_requests cr
       JOIN devices d ON cr.device_id = d.id
       WHERE cr.status = 'return_pending'
       ORDER BY cr.return_requested_at ASC`
    );

    const [reservations] = await pool.query(
      `SELECT r.*, d.model, d.manufacturer, d.asset_tag
       FROM reservations r
       JOIN devices d ON r.device_id = d.id
       WHERE r.status = 'pending'
       ORDER BY r.requested_at ASC`
    );

    res.json({ checkouts, returns, reservations });
  } catch (err) {
    next(err);
  }
});

// ---------- Checkout approvals ----------

// POST /api/admin/checkout-requests/:id/approve
router.post('/checkout-requests/:id/approve', async (req, res, next) => {
  try {
    const { id } = req.params;

    const [requests] = await pool.query(
      `SELECT * FROM checkout_requests WHERE id = ?`,
      [id]
    );
    if (requests.length === 0) {
      return res.status(404).json({ error: 'Checkout request not found' });
    }

    const request = requests[0];
    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending requests can be approved' });
    }

    // Check device is still available
    const [devices] = await pool.query(
      `SELECT status FROM devices WHERE id = ?`,
      [request.device_id]
    );
    if (devices[0].status !== 'available') {
      return res.status(400).json({ error: 'Device is no longer available' });
    }

    await pool.query('BEGIN');
    try {
      await pool.query(
        `UPDATE checkout_requests 
         SET status = 'approved', approved_at = NOW(), approved_by = ?
         WHERE id = ?`,
        [req.admin.username, id]
      );

      await pool.query(
        `UPDATE devices 
         SET status = 'checked_out', 
             current_holder_name = ?, 
             current_holder_email = ?
         WHERE id = ?`,
        [request.requester_name, request.requester_email, request.device_id]
      );

      await logEvent({
        eventType: 'checkout_approved',
        deviceId: request.device_id,
        actorName: req.admin.username,
        actorEmail: null,
        details: { requestId: id, requester: request.requester_email }
      });

      // Send email notification
      const [devices] = await pool.query(`SELECT * FROM devices WHERE id = ?`, [request.device_id]);
      if (devices.length > 0) {
        await sendEmail(request.requester_email, 'checkoutApproved', {
          deviceModel: devices[0].model,
          manufacturer: devices[0].manufacturer,
          assetTag: devices[0].asset_tag,
          expectedReturnDate: request.expected_return_date,
          purpose: request.purpose
        });
      }

      await pool.query('COMMIT');
      res.json({ status: 'approved' });
    } catch (err) {
      await pool.query('ROLLBACK');
      throw err;
    }
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/checkout-requests/:id/reject
router.post('/checkout-requests/:id/reject', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ error: 'rejection_reason is required' });
    }

    const [requests] = await pool.query(
      `SELECT * FROM checkout_requests WHERE id = ?`,
      [id]
    );
    if (requests.length === 0) {
      return res.status(404).json({ error: 'Checkout request not found' });
    }

    if (requests[0].status !== 'pending') {
      return res.status(400).json({ error: 'Only pending requests can be rejected' });
    }

    await pool.query(
      `UPDATE checkout_requests 
       SET status = 'rejected', rejection_reason = ?
       WHERE id = ?`,
      [reason, id]
    );

    await logEvent({
      eventType: 'checkout_rejected',
      deviceId: requests[0].device_id,
      actorName: req.admin.username,
      actorEmail: null,
      details: { requestId: id, reason }
    });

    // Send email notification
    const [devices] = await pool.query(`SELECT * FROM devices WHERE id = ?`, [requests[0].device_id]);
    if (devices.length > 0) {
      await sendEmail(requests[0].requester_email, 'checkoutRejected', {
        deviceModel: devices[0].model,
        manufacturer: devices[0].manufacturer,
        assetTag: devices[0].asset_tag,
        reason: reason
      });
    }

    res.json({ status: 'rejected' });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/checkout-requests/:id/approve-return
router.post('/checkout-requests/:id/approve-return', async (req, res, next) => {
  try {
    const { id } = req.params;

    const [requests] = await pool.query(
      `SELECT * FROM checkout_requests WHERE id = ?`,
      [id]
    );
    if (requests.length === 0) {
      return res.status(404).json({ error: 'Checkout request not found' });
    }

    const request = requests[0];
    if (request.status !== 'return_pending') {
      return res.status(400).json({ error: 'Only return_pending requests can be approved' });
    }

    await pool.query('BEGIN');
    try {
      await pool.query(
        `UPDATE checkout_requests 
         SET status = 'returned', return_approved_at = NOW(), actual_return_at = NOW()
         WHERE id = ?`,
        [id]
      );

      await pool.query(
        `UPDATE devices 
         SET status = 'available', 
             current_holder_name = NULL, 
             current_holder_email = NULL
         WHERE id = ?`,
        [request.device_id]
      );

      await logEvent({
        eventType: 'return_approved',
        deviceId: request.device_id,
        actorName: req.admin.username,
        actorEmail: null,
        details: { requestId: id, requester: request.requester_email }
      });

      // Send return confirmation email
      const [devices] = await pool.query(`SELECT * FROM devices WHERE id = ?`, [request.device_id]);
      if (devices.length > 0) {
        await sendEmail(request.requester_email, 'returnApproved', {
          deviceModel: devices[0].model,
          manufacturer: devices[0].manufacturer,
          assetTag: devices[0].asset_tag,
          returnDate: new Date().toISOString().split('T')[0]
        });
      }

      // Notify first person on waitlist
      const [waitlist] = await pool.query(
        `SELECT * FROM waitlist 
         WHERE device_id = ? AND status = 'waiting'
         ORDER BY position ASC
         LIMIT 1`,
        [request.device_id]
      );

      if (waitlist.length > 0) {
        await pool.query(
          `UPDATE waitlist SET status = 'notified' WHERE id = ?`,
          [waitlist[0].id]
        );
        
        // Send waitlist notification email
        if (devices.length > 0) {
          await sendEmail(waitlist[0].requester_email, 'waitlistNotification', {
            deviceModel: devices[0].model,
            manufacturer: devices[0].manufacturer,
            assetTag: devices[0].asset_tag,
            deviceId: request.device_id,
            position: waitlist[0].position
          });
        }
        
        await logEvent({
          eventType: 'waitlist_notified',
          deviceId: request.device_id,
          actorName: 'system',
          actorEmail: null,
          details: { waitlistId: waitlist[0].id, email: waitlist[0].requester_email }
        });
      }

      await pool.query('COMMIT');
      res.json({ status: 'returned', waitlistNotified: waitlist.length > 0 });
    } catch (err) {
      await pool.query('ROLLBACK');
      throw err;
    }
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/devices/:id/force-return - Admin force returns a checked-out device
router.post('/devices/:id/force-return', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find active checkout for this device
    const [checkouts] = await pool.query(
      `SELECT * FROM checkout_requests 
       WHERE device_id = ? AND status = 'approved'
       ORDER BY approved_at DESC
       LIMIT 1`,
      [id]
    );

    if (checkouts.length === 0) {
      return res.status(400).json({ error: 'No active checkout found for this device' });
    }

    const checkout = checkouts[0];

    await pool.query('BEGIN');
    try {
      // Mark checkout as returned
      await pool.query(
        `UPDATE checkout_requests 
         SET status = 'returned', 
             return_approved_at = NOW(), 
             actual_return_at = NOW()
         WHERE id = ?`,
        [checkout.id]
      );

      // Mark device as available
      await pool.query(
        `UPDATE devices 
         SET status = 'available', 
             current_holder_name = NULL, 
             current_holder_email = NULL
         WHERE id = ?`,
        [id]
      );

      await logEvent({
        eventType: 'force_return',
        deviceId: Number(id),
        actorName: req.admin.username,
        actorEmail: null,
        details: { checkoutId: checkout.id, originalHolder: checkout.requester_email }
      });

      // Notify waitlist
      const [waitlist] = await pool.query(
        `SELECT * FROM waitlist 
         WHERE device_id = ? AND status = 'waiting'
         ORDER BY position ASC
         LIMIT 1`,
        [id]
      );

      if (waitlist.length > 0) {
        await pool.query(
          `UPDATE waitlist SET status = 'notified' WHERE id = ?`,
          [waitlist[0].id]
        );
      }

      await pool.query('COMMIT');
      res.json({ success: true, waitlistNotified: waitlist.length > 0 });
    } catch (err) {
      await pool.query('ROLLBACK');
      throw err;
    }
  } catch (err) {
    next(err);
  }
});

// ---------- Reservation approvals ----------

// POST /api/admin/reservations/:id/approve
router.post('/reservations/:id/approve', async (req, res, next) => {
  try {
    const { id } = req.params;

    const [reservations] = await pool.query(
      `SELECT * FROM reservations WHERE id = ?`,
      [id]
    );
    if (reservations.length === 0) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    if (reservations[0].status !== 'pending') {
      return res.status(400).json({ error: 'Only pending reservations can be approved' });
    }

    // Check for overlaps again
    const [overlaps] = await pool.query(
      `SELECT COUNT(*) as count FROM reservations
       WHERE device_id = ? 
       AND status IN ('approved', 'active')
       AND id != ?
       AND NOT (reserve_to < ? OR reserve_from > ?)`,
      [reservations[0].device_id, id, reservations[0].reserve_from, reservations[0].reserve_to]
    );
    if (overlaps[0].count > 0) {
      return res.status(400).json({ error: 'Overlapping approved reservation exists' });
    }

    await pool.query(
      `UPDATE reservations 
       SET status = 'approved', approved_at = NOW()
       WHERE id = ?`,
      [id]
    );

    await logEvent({
      eventType: 'reservation_approved',
      deviceId: reservations[0].device_id,
      actorName: req.admin.username,
      actorEmail: null,
      details: { reservationId: id, requester: reservations[0].requester_email }
    });

    // Send email notification
    const [devices] = await pool.query(`SELECT * FROM devices WHERE id = ?`, [reservations[0].device_id]);
    if (devices.length > 0) {
      await sendEmail(reservations[0].requester_email, 'reservationApproved', {
        deviceModel: devices[0].model,
        manufacturer: devices[0].manufacturer,
        assetTag: devices[0].asset_tag,
        reserveFrom: reservations[0].reserve_from,
        reserveTo: reservations[0].reserve_to,
        purpose: reservations[0].purpose
      });
    }

    res.json({ status: 'approved' });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/reservations/:id/reject
router.post('/reservations/:id/reject', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ error: 'rejection_reason is required' });
    }

    const [reservations] = await pool.query(
      `SELECT * FROM reservations WHERE id = ?`,
      [id]
    );
    if (reservations.length === 0) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    if (reservations[0].status !== 'pending') {
      return res.status(400).json({ error: 'Only pending reservations can be rejected' });
    }

    await pool.query(
      `UPDATE reservations 
       SET status = 'rejected', rejection_reason = ?
       WHERE id = ?`,
      [reason, id]
    );

    await logEvent({
      eventType: 'reservation_rejected',
      deviceId: reservations[0].device_id,
      actorName: req.admin.username,
      actorEmail: null,
      details: { reservationId: id, reason }
    });

    // Send email notification
    const [devices] = await pool.query(`SELECT * FROM devices WHERE id = ?`, [reservations[0].device_id]);
    if (devices.length > 0) {
      await sendEmail(reservations[0].requester_email, 'reservationRejected', {
        deviceModel: devices[0].model,
        manufacturer: devices[0].manufacturer,
        assetTag: devices[0].asset_tag,
        reserveFrom: reservations[0].reserve_from,
        reserveTo: reservations[0].reserve_to,
        reason: reason
      });
    }

    res.json({ status: 'rejected' });
  } catch (err) {
    next(err);
  }
});

// ---------- Device CRUD ----------

const deviceSchema = z.object({
  model: z.string().min(1).max(120),
  manufacturer: z.string().min(1).max(80),
  os: z.enum(['iOS', 'Android', 'Other']),
  os_version: z.string().max(40).optional().or(z.literal('').transform(() => undefined)),
  serial_no: z.string().min(1).max(120),
  asset_tag: z.string().min(1).max(60),
  purchase_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('').transform(() => undefined)),
  status: z.enum(['available', 'checked_out', 'reserved', 'under_repair', 'retired']),
  notes: z.string().optional().or(z.literal('').transform(() => undefined)),
});

// POST /api/admin/devices
router.post('/devices', async (req, res, next) => {
  try {
    const data = deviceSchema.parse(req.body);

    const [result] = await pool.query(
      `INSERT INTO devices 
       (model, manufacturer, os, os_version, serial_no, asset_tag, purchase_date, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.model, data.manufacturer, data.os, data.os_version || null, data.serial_no, 
       data.asset_tag, data.purchase_date || null, data.status, data.notes || null]
    );

    await logEvent({
      eventType: 'device_created',
      deviceId: result.insertId,
      actorName: req.admin.username,
      actorEmail: null,
      details: { model: data.model, asset_tag: data.asset_tag }
    });

    res.status(201).json({ id: result.insertId });
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/devices/:id
router.put('/devices/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = deviceSchema.partial().parse(req.body);

    const fields = [];
    const values = [];
    for (const [key, val] of Object.entries(data)) {
      fields.push(`${key} = ?`);
      values.push(val);
    }
    values.push(id);

    await pool.query(
      `UPDATE devices SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    await logEvent({
      eventType: 'device_updated',
      deviceId: Number(id),
      actorName: req.admin.username,
      actorEmail: null,
      details: data
    });

    res.json({ updated: true });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/devices/:id
router.delete('/devices/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    await pool.query(`DELETE FROM devices WHERE id = ?`, [id]);

    await logEvent({
      eventType: 'device_deleted',
      deviceId: Number(id),
      actorName: req.admin.username,
      actorEmail: null,
      details: {}
    });

    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
});

// ---------- Health log resolution ----------

// POST /api/admin/health-logs/:id/resolve
router.post('/health-logs/:id/resolve', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { resolution_notes } = req.body;

    await pool.query(
      `UPDATE health_logs 
       SET resolved = 1, resolved_at = NOW(), resolution_notes = ?
       WHERE id = ?`,
      [resolution_notes || null, id]
    );

    const [logs] = await pool.query(`SELECT device_id FROM health_logs WHERE id = ?`, [id]);
    if (logs.length > 0) {
      await logEvent({
        eventType: 'health_issue_resolved',
        deviceId: logs[0].device_id,
        actorName: req.admin.username,
        actorEmail: null,
        details: { healthLogId: Number(id) }
      });
    }

    res.json({ resolved: true });
  } catch (err) {
    next(err);
  }
});

// ---------- Analytics ----------

// GET /api/admin/analytics
router.get('/analytics', async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Most requested devices (last 30 days)
    const [mostRequested] = await pool.query(
      `SELECT d.id, d.model, d.manufacturer, COUNT(cr.id) as request_count
       FROM devices d
       LEFT JOIN checkout_requests cr ON d.id = cr.device_id 
         AND cr.status = 'approved' 
         AND cr.approved_at >= ?
       WHERE d.status != 'retired'
       GROUP BY d.id
       ORDER BY request_count DESC
       LIMIT 10`,
      [thirtyDaysAgo]
    );

    // Idle devices (60 days)
    const [idleDevices] = await pool.query(
      `SELECT d.id, d.model, d.manufacturer, d.asset_tag
       FROM devices d
       LEFT JOIN checkout_requests cr ON d.id = cr.device_id 
         AND cr.status = 'approved' 
         AND cr.approved_at >= ?
       WHERE d.status != 'retired'
       GROUP BY d.id
       HAVING COUNT(cr.id) = 0`,
      [sixtyDaysAgo]
    );

    // Average checkout duration
    const [avgDuration] = await pool.query(
      `SELECT AVG(DATEDIFF(actual_return_at, approved_at)) as avg_days
       FROM checkout_requests
       WHERE status = 'returned' AND actual_return_at IS NOT NULL`
    );

    // Overdue rate
    const [overdueStats] = await pool.query(
      `SELECT 
         COUNT(*) as total_returns,
         SUM(CASE WHEN actual_return_at > expected_return_date THEN 1 ELSE 0 END) as overdue_count
       FROM checkout_requests
       WHERE status = 'returned' AND actual_return_at IS NOT NULL`
    );

    const overdueRate = overdueStats[0].total_returns > 0
      ? (overdueStats[0].overdue_count / overdueStats[0].total_returns * 100).toFixed(1)
      : 0;

    // Top requesters
    const [topRequesters] = await pool.query(
      `SELECT requester_name, requester_email, COUNT(*) as checkout_count
       FROM checkout_requests
       WHERE status = 'approved'
       GROUP BY requester_email, requester_name
       ORDER BY checkout_count DESC
       LIMIT 10`
    );

    // Health hotspots
    const [healthHotspots] = await pool.query(
      `SELECT d.id, d.model, d.manufacturer, COUNT(h.id) as issue_count
       FROM devices d
       JOIN health_logs h ON d.id = h.device_id
       WHERE h.reported_at >= ?
       GROUP BY d.id
       ORDER BY issue_count DESC
       LIMIT 10`,
      [thirtyDaysAgo]
    );

    // Current utilization
    const [utilization] = await pool.query(
      `SELECT 
         COUNT(*) as total_devices,
         SUM(CASE WHEN status = 'checked_out' THEN 1 ELSE 0 END) as checked_out
       FROM devices
       WHERE status != 'retired'`
    );

    const utilizationRate = utilization[0].total_devices > 0
      ? (utilization[0].checked_out / utilization[0].total_devices * 100).toFixed(1)
      : 0;

    // Overdue devices currently
    const [currentOverdue] = await pool.query(
      `SELECT COUNT(*) as count
       FROM checkout_requests
       WHERE status = 'approved' AND expected_return_date < ?`,
      [today]
    );

    res.json({
      mostRequested,
      idleDevices,
      avgCheckoutDays: avgDuration[0].avg_days ? Math.round(avgDuration[0].avg_days) : 0,
      overdueRate: Number(overdueRate),
      topRequesters,
      healthHotspots,
      utilizationRate: Number(utilizationRate),
      currentOverdueCount: currentOverdue[0].count,
    });
  } catch (err) {
    next(err);
  }
});

// ---------- Audit log ----------

// GET /api/admin/audit-log
router.get('/audit-log', async (req, res, next) => {
  try {
    const { event_type, device_id, limit = 100 } = req.query;

    let sql = `SELECT * FROM audit_log WHERE 1=1`;
    const params = [];

    if (event_type) {
      sql += ` AND event_type = ?`;
      params.push(event_type);
    }
    if (device_id) {
      sql += ` AND device_id = ?`;
      params.push(device_id);
    }

    sql += ` ORDER BY created_at DESC LIMIT ?`;
    params.push(Number(limit));

    const [logs] = await pool.query(sql, params);
    res.json(logs);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
