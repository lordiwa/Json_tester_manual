const { readJsonFile } = require('./utils/jsonFileReader');

const testFilePath = './TestA/example.json';

readJsonFile(testFilePath)
.then(data => {
console.log('JSON file content:', data);
console.log('The JSON file has been read and parsed successfully.');
})
.catch(error => {
console.error('Error reading the JSON file:', error);
});