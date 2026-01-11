import express from 'express';
import cors from 'cors';
import path from 'path';
import passport from 'passport';
import { config } from './config/index.js';
import { configurePassport } from './config/passport.js';
import routes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const app = express();

// Middleware
app.use(cors({
  origin: config.clientUrl,
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Статические файлы (uploads)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Passport initialization
configurePassport();
app.use(passport.initialize());

// Request logging в development
if (config.nodeEnv === 'development') {
  app.use((req, _res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
  });
}

// API routes
app.use('/api', routes);

// Root endpoint
app.get('/', (_, res) => {
  res.json({
    name: 'Meeting Room Booking API',
    version: '1.0.0',
    docs: '/api/health',
  });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
