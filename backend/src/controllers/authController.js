const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

// Hash the admin password once at module load
let adminPasswordHash = null;
function getHash() {
  if (!adminPasswordHash) {
    adminPasswordHash = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'admin', 10);
  }
  return adminPasswordHash;
}

async function login(req, res, next) {
  try {
    const { username, password } = loginSchema.parse(req.body);
    const expectedUsername = process.env.ADMIN_USERNAME || 'admin';

    if (username !== expectedUsername) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const ok = await bcrypt.compare(password, getHash());
    if (!ok) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ role: 'admin', username }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '12h',
    });

    res.json({ token, username });
  } catch (err) {
    next(err);
  }
}

module.exports = { login };
