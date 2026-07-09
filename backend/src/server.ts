import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth';
import spaceRoutes from './routes/space';

const app = express();

// Standard middlewares
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

// CORS configuration (Credentials allowed for cookie transmission)
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

// Route configurations
app.use('/api/auth', authRoutes);
app.use('/api/spaces', spaceRoutes);

// Generic fallback handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found.' });
});

export default app;
