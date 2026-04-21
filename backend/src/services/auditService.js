const pool = require('../db/pool');

async function logEvent({ eventType, deviceId = null, actorName = null, actorEmail = null, details = {} }) {
  try {
    await pool.query(
      `INSERT INTO audit_log (event_type, device_id, actor_name, actor_email, details)
       VALUES (?, ?, ?, ?, ?)`,
      [eventType, deviceId, actorName, actorEmail, JSON.stringify(details)]
    );
  } catch (err) {
    console.error('Audit log failed:', err);
  }
}

module.exports = { logEvent };
