import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'CalorieSnap API is running' });
});

// Import routes (we'll create these)
// app.use('/api/auth', authRoutes);
// app.use('/api/meals', mealRoutes);
// app.use('/api/ai', aiRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});