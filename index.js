const path = require('path')
const { pairFiles } = require('./utils/filePairer')
const { compareJsonObjects } = require('./utils/jsonComparer')
const testADirectory = path.join(__dirname, 'TestA')
const testBDirectory = path.join(__dirname, 'TestB')
const fs = require('fs');


const pairedFiles = pairFiles(testADirectory, testBDirectory)
console.log('Paired files:', pairedFiles)
pairedFiles.forEach((pair) => {
  //split pair.fileA and pair.fileB into arrays based on //
  console.log('Comparing files:', pair.filename)
  const fileA = fs.readFileSync(pair.fileA, 'utf8')
  const fileB = fs.readFileSync(pair.fileB, 'utf8')
  compareJsonObjects(fileA, fileB, pair.filename)
})
