// Load secret values from .env into process.env
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Allow the frontend (different port) to send requests here
app.use(cors());

// Allow the server to understand JSON sent in requests
app.use(express.json());

// A simple test route — just to confirm the server is alive
app.get('/', (req, res) => {
  res.send('Mesob Sululta backend is running.');
});

// Connect to MongoDB using the address from .env
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});