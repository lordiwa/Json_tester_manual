const fs = require('fs');
const path = require('path');

const listJsonFiles = (directory) => {
  return fs.readdirSync(directory)
    .filter(file => path.extname(file).toLowerCase() === '.json');
};

const pairFiles = (dirPathA, dirPathB) => {
  const fileListA = listJsonFiles(dirPathA);
  const fileListB = listJsonFiles(dirPathB);

  const pairedFiles = fileListA.reduce((pairs, fileA) => {
    const matchingFileB = fileListB.find(fileB => fileB === fileA);
    if (matchingFileB) {
      pairs.push({ fileA: path.join(dirPathA, fileA), filename:matchingFileB, fileB: path.join(dirPathB, matchingFileB)});
    }
    return pairs;
  }, []);

  return pairedFiles;
};

module.exports = {
  pairFiles
};
