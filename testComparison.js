const { compareJsonObjects } = require('./utils/jsonComparer');

// Example JSON objects to compare
const originalJson = {
name: "Original Object",
value: 100,
nested: {
key: "original"
}
};

const modifiedJson = {
name: "Modified Object",
value: 100,
nested: {
key: "modified"
},
additional: "This is a new property"
};

// Compare the example JSON objects
const differences = compareJsonObjects(originalJson, modifiedJson);

// Output the result of the comparison
console.log(differences);