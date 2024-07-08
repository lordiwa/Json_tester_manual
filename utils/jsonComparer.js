const diff = require('deep-diff').diff;
const fs = require('fs');
const _ = require('lodash'); // Lodash library for deep cloning
const keysToIgnore = ['referenceIdId','accessorialId','rateDetailId','addressId','logEntryId','noteId',
  'partyId','rateItemId', 'timestamp','discountId','divisionId','commodityDetailId','ratingId', 'bolTstamp','updtts',
  'oldDelDueDate','oldAdvDueDate','fullDelReportTs','fullDelPostedTs','dueDateChanged','dueDate', 'deliveryReported',
  'deliveryPosted','delDueDate','custSuppEndTime','custSuppDueDate','custSuppBegTime','custSuppBegDate',
  'committedTstamp','advDueDate','projApptDate','projAppPostedTs']
/**
 * Compares two JSON objects and returns the differences.
 * @param {Object} originalObj - The original JSON object.
 * @param {Object} modifiedObj - The modified JSON object to compare against the original.
 * @returns {Array} An array of differences.
 */
let currentObj
//const initialKey = ""
const initialKey = "assetRating."
let allTheTests = []
let parityFilename, coverageFilename
let mdCompiled = []
let differencesCount = 0
const compareJsonObjects = (originalObj, modifiedObj, filename) => {
  // Create deep copies of the objects
  const originalObjCopy = _.cloneDeep(originalObj);
  const modifiedObjCopy = _.cloneDeep(modifiedObj);

  // Delete the keys to ignore from the copied objects
  keysToIgnore.forEach(key => {
    delete originalObjCopy[key];
    delete modifiedObjCopy[key];
  });
  currentObj = modifiedObjCopy
  // Compare the copied objects
  const differences = diff(originalObjCopy, modifiedObjCopy);
  convertToMd(differences, filename);
}

function isJsonString(str) {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
}

// Step 1: Generate a markdown file with key-value pairs
function generateFullCoverageMd(obj) {
  let mdString = '';
  let stack = [{ obj, path: '' }];
  while (stack.length > 0) {
  let { obj, path } = stack.pop();
    if (isJsonString(obj)) {
      obj = JSON.parse(obj);
    }
    for (let key in obj) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        // If the value is an object or array, add it to the stack with the updated path
        stack.push({ obj: obj[key], path: `${path}${key}.` });
      } else {
        // Generate a markdown line for the key-value pair
        mdString += `- **${path}${key}** = '${obj[key]}'\n`;
      }
    }
  }

  return mdString;
}

// Step 2: Convert the markdown file into a Postman collection
function generateFullCoveragePostmanCollection(mdString) {
  const regex = /- \*\*(.*?)\*\* = '(.*?)'/g;
  let match;
  const tests = [];

  while ((match = regex.exec(mdString)) !== null) {
    const [_, key, value] = match;
    tests.push({
      name: `Verify ${addBrackets(key)} contains ${value}`,
      key: addBrackets(key),
      expected: value
    });
  }
  const collection = generateFullPostmanCollection(tests);
  //const collectionJson = JSON.stringify(collection, null, 4);

  // Step 3: Save the Postman collection into the Results/Postman/ directory
  fs.writeFile('./Results/Postman/'+ coverageFilename +'.json', collection, (err) => {
    if (err) {
      console.error('Error writing to file:', err);
    } else {
      console.log('Full coverage Postman collection saved successfully.');
    }
  });
}


function convertToMd(differences, filename) {
  coverageFilename = 'full_'+filename.split('.')[0]
  if (typeof differences !== "undefined") {
    let mdString = `# Differences\n\n`;
    const currentFilename = filename.split('.')[0] + '.md';
    parityFilename = 'par_'+filename.split('.')[0]
    coverageFilename = 'full_'+filename.split('.')[0]
    differences.forEach((diff, index) => {
      const lhsObj = JSON.parse(diff.lhs);
      const rhsObj = JSON.parse(diff.rhs);
      mdString += `## Difference ${index + 1}\n`;
      mdString += processKeys(lhsObj, rhsObj, currentFilename);
      mdString += `\n`;
    });
    // using a forEach concatenate mdCompiled and store it in mdCompiledString
    let mdCompiledString = ''
    mdCompiled.forEach((element) => {
        mdCompiledString += element
    })
    let compiledArray = mdCompiledString.split('-b-')
    //remove repeated elements in the array
    compiledArray = [...new Set(compiledArray)]
    mdCompiledString = ''
    compiledArray.forEach((element) => {
      mdCompiledString += element + '\n---\n'
    })
    differencesCount = compiledArray.length - 1
    const mdStringTosend = '**ProNumber**:'
        + filename.split('.')[0]
        + '\n'
        + '**Differences Found**:'
        + differencesCount
        + '\n---\n'
        + mdCompiledString
    const filePath = './Results/MdResults/'+ currentFilename
    fs.writeFile(filePath, mdStringTosend, (err) => {
      if (err) {
        console.error('Error writing to file:', err);
      } else {
        console.log(`Markdown file saved successfully at ${filePath}`);
      }
    });
  }


  generatePostmanCollection(allTheTests)
  const fullMdString = generateFullCoverageMd(currentObj);
  generateFullCoveragePostmanCollection(fullMdString);
}

function processKeys(lhsObj, rhsObj, filename, fatherName="") {
  let mdString = '';
  const currentFilename = filename.split('.')[0];
  Object.keys(lhsObj).forEach((key) => {
    let oldVal = lhsObj[key];
    let newVal = rhsObj[key];

    // Check if the value is a string that can be parsed into an object or array
    if (typeof oldVal === 'string' && (oldVal.startsWith('{') || oldVal.startsWith('['))) {
      try {
        oldVal = JSON.parse(oldVal);
      } catch (e) {
        console.error(`Error parsing oldVal for key ${key}:`, e);
      }
    }
    if (typeof newVal === 'string' && (newVal.startsWith('{') || newVal.startsWith('['))) {
      try {
        newVal = JSON.parse(newVal);
      } catch (e) {
        console.error(`Error parsing newVal for key ${key}:`, e);
      }
    }
    // here we set the name and verify if it's a number to parse it correctly
    let keyFullName
    // check if it's a number
    if (!isNaN(parseInt(key))){
      keyFullName = fatherName!== '' ? fatherName+"["+key+"]" : "["+key+"]"
    } else{
      keyFullName = fatherName!== '' ? fatherName+"."+key:key
    }
    if (typeof oldVal === 'object' && typeof newVal === 'object') {
      processKeys(oldVal, newVal, currentFilename+'_'+key+".md", keyFullName);
    } else if(oldVal !== newVal){
      if(keysToIgnore.find(k => k === key)){
        console.log("SKIPPED", key)
      } else {
        mdString += `-b-- **${keyFullName}**:\n  - Old Value: \`${JSON.stringify(oldVal)}\`\n  - New Value: \`${JSON.stringify(newVal)}\`\n`;
      }
    }
    if(mdString != ''){
      mdCompiled.push(mdString)
      allTheTests.push(parseDataAndCreateTests(mdString))
    }
  });
  if (allTheTests.length > 0) {
    allTheTests = allTheTests.flat()
    allTheTests = [...new Set(allTheTests)];
    return allTheTests
  }

}

function parseDataAndCreateTests(input) {
  const regex = /- \*\*(.*?)\*\*:\n  - Old Value: `(.*)`\n  - New Value: `(.*)`/g;
  let match;
  const tests = [];

  while ((match = regex.exec(input)) !== null) {
    const [_, key, oldValue, newValue] = match;
    tests.push({
      name: `Verify ${addBrackets(key)} equals ${newValue}`,
      key: key,
      expected: newValue
    });
  }
  const theTests = generatePostmanTests(tests)
  return theTests
}

function addBrackets(str) {
  return str.replace(/\.(\d+)/g, '[$1]');
}

function generateFullPostmanCollection(tests) {
  let currentTests = []
  tests.forEach((test) => {
    const name = test.name;
    const key = addBrackets(test.key);
    const expected = test.expected;
    const elementToAdd = "pm.test("
        +"'"+name+"'"
        +", function() {"
        +"\n const testingElement = pm.response.json()." + initialKey
        +key+";"
        +"\n pm.expect(testingElement.toString(),'"+expected+"').to.equal('"
        + expected + "');" +"\n});"
    currentTests.push(elementToAdd)
  })
  let currentTestsString = JSON.stringify(currentTests);
  let currentTestsObject = JSON.parse(currentTestsString);
  const collection = {
    info: {
      name: 'Test_Pro_'+ coverageFilename ,
      schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
    },
    item: {
      name: 'Test_Pro_'+ coverageFilename,
      event: [{
        listen: "test",
        script: {
          exec: currentTestsObject,
          type: "text/javascript"
        }
      }],
      request: {
        method: "POST",
        url: "{{baseUrl}}/Pricing/AssetPricing", // You need to replace this with the actual API URL
        description: "Tests if the Golden Standard Values are as expected.",
        header: [
          {
            key: "x-consumer-id",
            value: "QA",
            type: "default"
          }
        ],
        body: {
          mode: "raw",
          raw: "",
          options: {
            raw: {
              language: "json"
            }
          }
        },
        url: {
          raw: "{{baseUrl}}/Pricing/AssetPricing",
          host: [
            "{{baseUrl}}"
          ],
          path: [
            "Pricing",
            "AssetPricing"
          ]
        }
      }
    },
    auth: {
      type: "apikey",
      apikey: [
        {
          key: "value",
          value: "31659299-806b-4797-9981-6228e09e9657",
          type: "string"
        },
        {
          key: "key",
          value: "x-api-key",
          type: "string"
        }
      ]
    },
    event: [
      {
        listen: "prerequest",
        script: {
          type: "text/javascript",
          exec: [
            ""
          ]
        }
      },
      {
        listen: "test",
        script: {
          type: "text/javascript",
          exec: [
            ""
          ]
        }
      }
    ],
    variable: [
      {
        key: "baseUrl",
        value: "https://testapps.dtc.corp/Rating/V2/API",
        type: "string"
      }
    ]
  }

  return JSON.stringify(collection, null, 4);
}

function generatePostmanTests(tests) {
  // add descriptor for fails like this pm.expect(tariff,'tariff').to.equal(" ");
  let currentTests = []
  tests.forEach((test) => {
    const name = test.name;
    const key = addBrackets(test.key);
    let expected = test.expected;
    // remove "" from the expected value
    if (expected.startsWith('"') && expected.endsWith('"')) {
      expected = expected.substring(1, expected.length - 1);
    }
    const elementToAdd = "pm.test("
        +"'"+name+"'"
        +", function() {"
        +"\n const testingElement = pm.response.json()." + initialKey
        +key+";"
        +"\n pm.expect(testingElement.toString(),'"+expected+"').to.equal('"
        + expected + "');" +"\n});"
    currentTests.push(elementToAdd)
  })
  //pm.expect(tariff,'tariff').to.equal(" ");
  let currentTestsString = JSON.stringify(currentTests);
  let currentTestsObject = JSON.parse(currentTestsString);
  return currentTestsObject
}

function generatePostmanCollection(tests) {
  let currentTests = tests
  let currentTestsString = JSON.stringify(currentTests);
  let currentTestsObject = JSON.parse(currentTestsString);

  const collection = {
    info: {
      name: 'Test_Pro_'+ parityFilename,
      schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
    },
    item: {
      name: 'Test_Pro_'+ parityFilename,
      event: [{
        listen: "test",
        script: {
          exec: currentTestsObject,
          type: "text/javascript"
        }
      }],
      request: {
        method: "POST",
        url: "{{baseUrl}}/Pricing/AssetPricing", // You need to replace this with the actual API URL
        description: "Parity tests for the API response. Generated Postman Tests",
        header: [
          {
            key: "x-consumer-id",
            value: "QA",
            type: "default"
          }
        ],
        body: {
          mode: "raw",
          raw: "",
          options: {
            raw: {
              language: "json"
            }
          }
        },
        url: {
          raw: "{{baseUrl}}/Pricing/AssetPricing",
          host: [
            "{{baseUrl}}"
          ],
          path: [
            "Pricing",
            "AssetPricing"
          ]
        }
      }
    },
    auth: {
      type: "apikey",
      apikey: [
        {
          key: "value",
          value: "31659299-806b-4797-9981-6228e09e9657",
          type: "string"
        },
        {
          key: "key",
          value: "x-api-key",
          type: "string"
        }
      ]
    },
    event: [
      {
        listen: "prerequest",
        script: {
          type: "text/javascript",
          exec: [
            ""
          ]
        }
      },
      {
        listen: "test",
        script: {
          type: "text/javascript",
          exec: [
            ""
          ]
        }
      }
    ],
    variable: [
      {
        key: "baseUrl",
        value: "https://testapps.dtc.corp/Rating/V2/API",
        type: "string"
      }
    ]
  }

  // Step 3: Save the Postman collection into the Results/Postman/ directory
  fs.writeFile('./Results/Postman/'+ parityFilename +'.json', JSON.stringify(collection, null, 4), (err) => {
    if (err) {
      console.error('Error writing to file:', err);
    } else {
      console.log('Full coverage Postman collection saved successfully.');
    }
  });

  return JSON.stringify(collection, null, 4);
}
module.exports = {
  compareJsonObjects
};

