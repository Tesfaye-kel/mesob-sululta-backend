const fs = require('fs');
const path = require('path');

const uploadRoot = process.env.VERCEL
  ? path.join('/tmp', 'mesob-uploads')
  : path.join(__dirname, '..', 'uploads');

function getUploadDir(category) {
  const directory = path.join(uploadRoot, category);
  fs.mkdirSync(directory, { recursive: true });
  return directory;
}

module.exports = { uploadRoot, getUploadDir };
