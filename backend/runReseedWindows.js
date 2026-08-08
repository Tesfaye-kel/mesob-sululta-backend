require('dotenv').config();
process.env.MONGO_URI = process.env.MONGODB_URI;
require('./reseedWindows');