import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

// Database & Middlewares
import connectDB from './config/db.js';
import errorHandler from './middleware/errorHandler.js';

// Routers
import authRouter from './routes/auth.js';
import recordRouter from './routes/records.js';
import slotRouter from './routes/slots.js';
import statsRouter from './routes/stats.js';
import reportsRouter from './routes/reports.js';
import settingsRouter from './routes/settings.js';

// 1. Initialize environment configurations
dotenv.config();

// Mongoose Models
import './models/User.js';
import './models/Slot.js';
import './models/Record.js';
import './models/Settings.js';

// 2. Connect to MongoDB
connectDB();

const app = express();

// 3. Configure Global Middlewares
app.use(helmet());
app.use(express.json());

// Set up CORS
const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';
app.use(cors({
  origin: allowedOrigin,
  credentials: true
}));

// Request logger in development
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// 4. Rate Limiter on Authentication Routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per 15 minutes
  message: {
    success: false,
    message: 'Too many login attempts from this IP, please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 5. Mount Routes
app.use('/api/auth', authLimiter, authRouter);
app.use('/api/records', recordRouter);
app.use('/api/slots', slotRouter);
app.use('/api/stats', statsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/settings', settingsRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Campus Parking System Backend is operational.' });
});

// Root welcome endpoint
app.get('/', (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: 'Welcome to the Galgotias University Parking Management System API.',
    healthcheck: '/health',
    endpoints: {
      auth: '/api/auth',
      records: '/api/records',
      slots: '/api/slots',
      stats: '/api/stats',
      reports: '/api/reports',
      settings: '/api/settings'
    }
  });
});

// 6. Mount Central Error Handler Middleware (Must be defined last)
app.use(errorHandler);

// 7. Start Listener
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error(`Unhandled Promise Rejection: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
