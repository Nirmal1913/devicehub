require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const { errorHandler } = require('./middleware/errorHandler');
const deviceRoutes = require('./routes/deviceRoutes');
const checkoutRoutes = require('./routes/checkoutRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
const waitlistRoutes = require('./routes/waitlistRoutes');
const healthRoutes = require('./routes/healthRoutes');
const activityRoutes = require('./routes/activityRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { startBackgroundJobs } = require('./services/backgroundJobs');

const app = express();

app.use(cors({
  origin: (process.env.FRONTEND_ORIGIN || 'http://localhost:5173').split(','),
  credentials: false,
}));
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));

// Health check
app.get('/api/health', (req, res) => res.json({ ok: true, service: 'devicehub' }));

// Public routes
app.use('/api/devices', deviceRoutes);
app.use('/api/checkout-requests', checkoutRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/waitlist', waitlistRoutes);
app.use('/api/health-logs', healthRoutes);
app.use('/api/my-activity', activityRoutes);

// Admin routes
app.use('/api/admin', adminRoutes);

// 404 + error handler
app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use(errorHandler);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 DeviceHub API running on http://localhost:${PORT}`);
  startBackgroundJobs();
});
