var path = require('path')
var fs = require('fs-extra')
const { exec } = require('child_process');

async function clearCache() {
    return new Promise(function (resolve, reject) {
       try {
        var localpath = process.cwd();
   
        const clear = exec('jest --clearCache', {
            cwd: localpath
        });

        clear.on('close', (code) => {
            console.log('cleared....');
            resolve(code)
        });
       } catch (err) {
          reject(err)
       }
    })
 }

module.exports = {
    runtest: function (testFiles, inputFileName) {
        return new Promise(async function (resolve, reject) {
            try {
                var numPassedTestSuites = 0;
                var numFailedTestSuites = 0;
                var localpath = process.cwd();
                await clearCache();
                var testList = testFiles.split(" ");

                const ls = exec('npm test --verbose -- --runInBand ' + testFiles, {
                    cwd: localpath
                });

                var nextTest = testList.shift();
                await global.db.update({
                    logs: `RUNNING:   ${nextTest} \n` 
                 }, inputFileName)

                ls.stdout.on('data', (data) => {
                    console.log(`stdout: ${data}`);
                });

                ls.stderr.on('data', async (data) => {
                    console.log(`stderr: ${data}`);
                    if (/PASS browser:/.test(data)) {
                        data = data.split("\n")[0] || ''
                        var oldData = await global.db.select("logs",inputFileName);
                        oldData = oldData[0] ? oldData[0].logs : "";
                        numPassedTestSuites +=1;
                        var nextTest = testList.shift();
                        nextTest = nextTest ? `RUNNING:   ${nextTest}\n`: "COMPLETED.!!"
                        await global.db.update({
                            logs : `${oldData}${data} \n${nextTest}`, 
                            numPassedTestSuites
                        }, inputFileName)
                    }
                    else if (/FAIL browser:/.test(data)){
                        data = data.split("\n")[0] || ''
                        var oldData = await global.db.select("logs",inputFileName);
                        oldData = oldData[0] ? oldData[0].logs : "";
                        var nextTest = testList.shift();
                        nextTest = nextTest ? `RUNNING:   ${nextTest}\n`: "COMPLETED.!!"
                        numFailedTestSuites +=1;
                        await global.db.update({
                            logs : `${oldData}${data} \n${nextTest}`, 
                            numFailedTestSuites
                        }, inputFileName)
                    }
                });
                ls.on('close', (code) => {
                    resolve(code);
                });

            } catch (err) {
                reject(err);
            }
        });
    }
}

