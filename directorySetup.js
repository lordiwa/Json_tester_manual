const fs = require('fs');
const path = require('path');

// Function to create a directory if it doesn't exist
const createDirectory = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Main function to setup the directory structure
const setupDirectories = () => {
  const directories = ['TestA', 'TestB', 'Results'];
  directories.forEach((dirName) => {
    const fullPath = path.join(__dirname, dirName);
    createDirectory(fullPath);
  });
};

// Run directory setup
setupDirectories();

module.exports = setupDirectories;
