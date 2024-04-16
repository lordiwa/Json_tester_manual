const diff = require('deep-diff').diff;
const fs = require('fs');
/**
 * Compares two JSON objects and returns the differences.
 * @param {Object} originalObj - The original JSON object.
 * @param {Object} modifiedObj - The modified JSON object to compare against the original.
 * @returns {Array} An array of differences.
 */
const compareJsonObjects = (originalObj, modifiedObj, filename) => {
  const differences = diff(originalObj, modifiedObj)

  if (!differences) {
    console.log('No differences found.')
    return;
  }

  convertToMd(differences, filename);
}

function convertToMd(differences, filename) {
  let mdString = `# Differences\n\n`;

  differences.forEach((diff, index) => {
    // Parse the JSON strings in lhs and rhs to objects for detailed comparison
    const lhsObj = JSON.parse(diff.lhs);
    const rhsObj = JSON.parse(diff.rhs);
    console.log("lhsObj",lhsObj)
    console.log("rhsObj",rhsObj)
    mdString += `## Difference ${index + 1}\n`;
    Object.keys(lhsObj).forEach((key) => {
      if (lhsObj[key] !== rhsObj[key]) {
        mdString += `- **${key}**:\n  - Old Value: \`${JSON.stringify(lhsObj[key])}\`\n  - New Value: \`${JSON.stringify(rhsObj[key])}\`\n`
      }
    });
    mdString += `\n`;

  });
  const currentFilename = filename.split('.')[0] + '.md'
  console.log("Saving... ", currentFilename)
  fs.writeFile('./Results/'+currentFilename, mdString, (err) => {
    if (err) {
      console.error('Error writing to file:', err)
    } else {
      console.log('Markdown saved to '+ currentFilename)
    }
  });
  // Create the 'postman' directory and write the file
  const tests = parseDataAndCreateTests(mdString);
  const collectionJson = generatePostmanCollection(tests);
  const dirPath = './Results/Postman/API_Response_Changes.postman_collection.json'

  fs.mkdirSync('./Results/Postman/', { recursive: true });
  fs.writeFileSync(dirPath, collectionJson);

  console.log('Postman collection created successfully.');
  return mdString
}

function parseDataAndCreateTests(input) {
  const regex = /- \*\*(.*?)\*\*:\n  - Old Value: `(.*)`\n  - New Value: `(.*)`/g;
  let match;
  const tests = [];

  while ((match = regex.exec(input)) !== null) {
    const [_, key, oldValue, newValue] = match;
    tests.push({
      name: `Verify ${key} has changed correctly`,
      key: key,
      expected: newValue
    });
  }

  return tests;
}

function generatePostmanCollection(tests) {
  const collection = {
    info: {
      name: "API Response Changes",
      schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
    },
    item: tests.map(test => ({
      name: test.name,
      event: [{
        listen: "test",
        script: {
          exec: [
            `pm.test("${test.name}", function() {`,
            `    pm.expect(pm.response.json().${test.key}).to.eql("${test.expected}");`,
            `});`
          ],
          type: "text/javascript"
        }
      }],
      request: {
        method: "GET",
        url: "http://example.com/api", // You need to replace this with the actual API URL
        description: `Tests if the ${test.key} has changed to ${test.expected}`
      }
    }))
  }

  return JSON.stringify(collection, null, 4);
}


function parseMarkdown(mdFilePath) {
  const content = fs.readFileSync(mdFilePath, 'utf8');
  const differenceBlocks = content.split('## Difference').slice(1); // Split and ignore the first empty result
  return differenceBlocks.map(block => {
    const lines = block.trim().split('\n').filter(line => line.startsWith('- **'));
    return lines.map(line => {
      const [property, oldNewValue] = line.split(':').map(part => part.trim());
      const propertyClean = property.slice(3, -3); // Remove "- **" and "**"
      const values = oldNewValue.split('`').map(part => part.trim());
      return { property: propertyClean, old: values[1], new: values[3] };
    });
  });
}

// Function to generate Gherkin files from parsed differences
function generateGherkinFiles(differences, outputDir) {
  differences.forEach((diffSet, index) => {
    diffSet.forEach(diff => {
      const filename = `${diff.property.replace(/\s+/g, '_')}_${index + 1}.feature`;
      const gherkinContent = `Feature: Validate ${diff.property} change\n\n` +
          `Scenario: Change detected in ${diff.property}\n` +
          `  Given: ${filename}\n` +
          `  When: "${diff.old}"\n` +
          `  Then: "${diff.new}"\n`;
      fs.writeFileSync(path.join(outputDir, filename), gherkinContent);
    });
  });
}

module.exports = {
  compareJsonObjects
};

