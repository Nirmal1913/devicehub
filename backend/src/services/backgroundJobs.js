const pool = require('../db/pool');
const { logEvent } = require('./auditService');

async function activateDueReservations() {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Find approved reservations that should start today
    const [reservations] = await pool.query(
      `SELECT r.*, d.status as device_status 
       FROM reservations r
       JOIN devices d ON r.device_id = d.id
       WHERE r.status = 'approved' 
       AND r.reserve_from <= ?
       AND d.status = 'available'`,
      [today]
    );

    for (const res of reservations) {
      await pool.query('BEGIN');
      try {
        // Activate reservation
        await pool.query(
          `UPDATE reservations SET status = 'active' WHERE id = ?`,
          [res.id]
        );

        // Mark device as checked out
        await pool.query(
          `UPDATE devices 
           SET status = 'checked_out', 
               current_holder_name = ?, 
               current_holder_email = ?
           WHERE id = ?`,
          [res.requester_name, res.requester_email, res.device_id]
        );

        await logEvent({
          eventType: 'reservation_activated',
          deviceId: res.device_id,
          actorName: 'system',
          actorEmail: null,
          details: { reservationId: res.id, requester: res.requester_email }
        });

        await pool.query('COMMIT');
        console.log(`✓ Activated reservation #${res.id} for device #${res.device_id}`);
      } catch (err) {
        await pool.query('ROLLBACK');
        console.error('Failed to activate reservation:', err);
      }
    }

    // Complete expired reservations
    const [expired] = await pool.query(
      `SELECT id, device_id FROM reservations 
       WHERE status = 'active' AND reserve_to < ?`,
      [today]
    );

    for (const res of expired) {
      await pool.query(
        `UPDATE reservations SET status = 'completed' WHERE id = ?`,
        [res.id]
      );
      console.log(`✓ Completed reservation #${res.id}`);
    }

  } catch (err) {
    console.error('Background job error:', err);
  }
}

function startBackgroundJobs() {
  console.log('📅 Background jobs started (reservation activation)');
  // Run every 5 minutes
  setInterval(activateDueReservations, 5 * 60 * 1000);
  // Also run once on startup
  activateDueReservations();
}

module.exports = { startBackgroundJobs };
