const fs = require('fs');
var path = require('path')
var runCommand = require('./runtest');
const config = require("../../_config/testsuite.json");
//Number of test trigger = two times(*maximum)
var MAX_RETRY = 2;
var retryCnt = 1;

/*function getAutomationResult to get input testset name and replace filename 
from user and run the test cases and provided results data in json response 
 */

function validateInput(inputGroup) {
   return new Promise(function (resolve, reject) {
      try {
         //check if testset is there the config
         if (config.hasOwnProperty(inputGroup)) {
            resolve(true)
         } else {
            const resData = JSON.stringify(config);
            if (resData.indexOf(inputGroup + ".test.js") != -1) {
               resolve(true)
            }
            else{
               resolve(false)
            }
         } 
      } catch (err) {
         reject(err)
      }
   })
}

function getAutomationResult(inputGroup, inputFileName) {
   return new Promise(async function (resolve, reject) {
      try {
         if (config.hasOwnProperty(inputGroup)) {
            let configJSONString = config[inputGroup];
            var numTotalTestSuites = configJSONString.length;
            var data = configJSONString.join(' ');
         } 
         else {
            var data = inputGroup + ".test.js";
            var numTotalTestSuites = 1;
         }
         await global.db.update({
            numTotalTestSuites,
         }, inputFileName)
         //function to trigger test
         runCommand.runtest(data,inputFileName)
            .then(function () {
               //rename the reports.json and reports.html files
               const dirPath = path.join(__dirname, '../../reports');
               fs.renameSync(path.join(dirPath, "reports.json"), path.join(dirPath, inputFileName + ".json"));
               fs.renameSync(path.join(dirPath, "reports.html"), path.join(dirPath, inputFileName + ".html"));
               //read and take requiered response data from json file
               fs.readFile(path.join(dirPath, inputFileName + ".json"), "utf8", (err, jsonData) => {
                  if (err) {
                     return err;
                  } else {
                     try {
                        const resData = JSON.parse(jsonData);
                        //response data's
                        var resultData = {
                           "numTotalTests": resData.numTotalTests,
                           "numPassedTests": resData.numPassedTests,
                           "numFailedTests": resData.numFailedTests,
                           "numTotalTestSuites": resData.numTotalTestSuites,
                           "numPassedTestSuites": resData.numPassedTestSuites,
                           "numFailedTestSuites": resData.numFailedTestSuites,
                        };
                        resolve(resultData);
                     } catch (err) {
                        reject ("Error parsing JSON string:", err);
                     }
                  }
               });
            }).catch(function (err) {
               //retry when trigger test once failed *maximum trigger count =2
               if (retryCnt < MAX_RETRY) {
                  retryCnt++;
                  getAutomationResult(inputGroup, inputFileName);
               } else {
                  reject(err);
               }
            });
      }
      catch (err) {
         reject(err);
      }
   });
}

module.exports ={
   validateInput,
   getAutomationResult
}