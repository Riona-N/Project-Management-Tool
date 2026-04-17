const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/taskflow';

mongoose
  .connect(MONGO_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Import routes
const taskRoutes = require('./routes/taskRoutes');

// Predefined users
const USERS = {
  'student@vitapex.ac.in': { name: 'Student User', role: 'employee', password: 'student123' },
  'manager@gmail.com': { name: 'Manager', role: 'admin', password: 'manager123' }
};

// Login endpoint
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  
  const user = USERS[email];
  
  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }
  
  if (user.password !== password) {
    return res.status(401).json({ error: 'Invalid password' });
  }
  
  return res.json({ 
    success: true, 
    user: { 
      email, 
      name: user.name, 
      role: user.role,
      initials: user.name.split(' ').map(n => n[0]).join('')
    } 
  });
});

// Use routes
app.use('/tasks', taskRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ message: 'Backend is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
