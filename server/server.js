import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';
import connectDB from './config/db.js';

import authRoutes     from './routes/auth.js';
import recordRoutes   from './routes/records.js';
import slotRoutes     from './routes/slots.js';
import statsRoutes    from './routes/stats.js';
import reportsRoutes  from './routes/reports.js';
import settingsRoutes from './routes/settings.js';
import usersRoutes    from './routes/users.js';
import anprRoutes     from './routes/anpr.js';
import vehicleRoutes  from './routes/vehicle.js';
import aiRoutes       from './routes/ai.js';

dotenv.config();
connectDB();

const app = express();

// CORS — allow Netlify + localhost
app.use(cors({
  origin: [
    'https://galgotiasparkingmanagement.netlify.app',
    'http://localhost:5173',
    'http://localhost:3000'
  ],
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','PATCH','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
}));

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'SmartPark API running', time: new Date() });
});

// All routes
app.use('/api/auth',     authRoutes);
app.use('/api/records',  recordRoutes);
app.use('/api/slots',    slotRoutes);
app.use('/api/stats',    statsRoutes);
app.use('/api/reports',  reportsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/users',    usersRoutes);
app.use('/api/anpr',     anprRoutes);
app.use('/api/vehicle',  vehicleRoutes);
app.use('/api/ai',       aiRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
