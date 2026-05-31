import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import { connectRedis } from './utils/cache.js';

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
import anprRouter from './routes/anpr.js';
import vehicleRouter from './routes/vehicle.js';
import userRouter from './routes/users.js';
import bookingRouter from './routes/bookings.js';
import aiRouter from './routes/ai.js';
import passport from 'passport';
import session from 'express-session';
import configurePassport from './config/passport.js';

// 1. Initialize environment configurations
dotenv.config();

// Mongoose Models
import './models/User.js';
import './models/Slot.js';
import './models/Record.js';
import './models/Settings.js';
import './models/RegisteredVehicle.js';
import './models/AnprLog.js';

// 2. Connect to MongoDB
connectDB();
// Connect to Redis Cache
connectRedis();

// Initialize Passport configs
configurePassport();

const app = express();

app.use(session({
  secret: process.env.SESSION_SECRET || 'parking_session_secret_999',
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());

// 3. Configure Global Middlewares
app.use(compression());
app.use(helmet());
app.use(express.json());

// Set up CORS
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

// 5. Global API Rate Limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per 15 minutes
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 6. Mount Routes
app.use('/api', apiLimiter);
app.use('/api/auth', authLimiter, authRouter);
app.use('/api/records', recordRouter);
app.use('/api/slots', slotRouter);
app.use('/api/stats', statsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/anpr', anprRouter);
app.use('/api/vehicle', vehicleRouter);
app.use('/api/users', userRouter);
app.use('/api/bookings', bookingRouter);
app.use('/api/ai', aiRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Campus Parking System Backend is operational.' });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'SmartPark API is running',
    timestamp: new Date().toISOString()
  });
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
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error(`Unhandled Promise Rejection: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});

// DEPLOYMENT STEPS:
// 1. Push this code to GitHub repository
// 2. Go to railway.app → Login with GitHub
// 3. New Project → Deploy from GitHub repo
// 4. Select your backend folder/repo
// 5. Add all environment variables in Railway dashboard
// 6. Railway will auto-deploy and give you a URL like:
//    https://smartpark-backend.up.railway.app
// 7. Copy that URL → use in frontend .env
