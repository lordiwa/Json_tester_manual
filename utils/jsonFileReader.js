const fs = require('fs');

// Asynchronously read and parse a JSON file
const readJsonFile = (filePath) => {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        reject(err);
      } else {
        try {
          const obj = JSON.parse(data);
          resolve(obj);
        } catch (parseError) {
          reject(parseError);
        }
      }
    });
  });
};

module.exports = {
  readJsonFile
};
