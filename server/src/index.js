import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import foodRoutes from './routes/foodRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'CalorieSnap API is running',
    timestamp: new Date().toISOString(),
    apis: {
      clarifai: process.env.CLARIFAI_API_KEY ? '✅ Ready' : '❌ Missing',
      usda: process.env.USDA_API_KEY ? '✅ Ready' : '❌ Missing'
    }
  });
});

// Routes
app.use('/api/food', foodRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

app.listen(PORT, () => {
  console.log(`\n🚀 CalorieSnap Server Started`);
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌐 Health: http://localhost:${PORT}/health`);
  console.log(`\n🔧 API Status:`);
  console.log(`   Clarifai: ${process.env.CLARIFAI_API_KEY ? '✅ Ready' : '❌ Missing key'}`);
  console.log(`   USDA:     ${process.env.USDA_API_KEY ? '✅ Ready' : '❌ Missing key'}\n`);
});

export default app;