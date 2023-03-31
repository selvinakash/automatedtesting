const fs = require('fs');
const path = require('path')
const { v4: uuidv4 } = require("uuid")
var { validateInput, getAutomationResult } = require("./js/eventhandler")

module.exports = function (router) {
    router.post("/runTest", async function (req, res) {
        try {
            var { testSet } = req.query;
            var reportName = uuidv4();
            var isValidTest = await validateInput(testSet)
            // isValidTest = true;  // remove
            if (!isValidTest) {
                return res.status(404).send({
                    status: {
                        code: 404,
                        message: `${testSet} is not configured`,
                    },
                });
            }
            await global.db.insert({
                dateTime: new Date().toLocaleString(),
                jobid: reportName,
                testSet,
                status: "in-progress",
                logs: ""
            });
            getAutomationResult(testSet, reportName).then(async function (result) {
                var status = "failed"
                var { numTotalTests, numPassedTests, numFailedTests, numTotalTestSuites, numPassedTestSuites, numFailedTestSuites } = result
                if (numTotalTests == numPassedTests) {
                    status = "passed"
                }
                await global.db.update({
                    status,
                    numTotalTests,
                    numPassedTests,
                    numFailedTests,
                    numTotalTestSuites,
                    numPassedTestSuites,
                    numFailedTestSuites,
                    reportUrl: `./reports/${reportName}.html`
                }, reportName)
                res.status(200).send({
                    status: {
                        code: 200,
                        message: `Test run completed`,
                    },
                });
            })
            .catch(async function(e){
                await global.db.update({
                    status: "error",
                    numTotalTests,
                    numPassedTests,
                    numTotalTestSuites,
                    numPassedTestSuites,
                    reportUrl: `./reports/${reportName}.html`
                }, reportName)
                res.status(500).send({
                    status: {
                        code: 500,
                        message: `Error while running test cases`,
                        error: e
                    },
                });
            })
        }
        catch (e) {
            res.status(500).send({
                status: {
                    code: 500,
                    message: `Some unexpected occur!!`,
                },
            });
        }
    })

    router.post("/populateData", async function (req, res) {
        var jobid = null;
        var reqRows = "*"
        if(req.body){
            var { jobid, reqRows } = req.body
            // reqRows = reqRows ? reqRows : "*"
        }

        var rows = await global.db.select(reqRows,jobid);
        res.send(rows)
    })

    router.get("/viewResult/:fileName", function (req, res) {
        var { fileName } = req.params;
        var htmFilePath = path.join("./", "reports", `${fileName}.html`)
        if (fs.existsSync(htmFilePath)) {
            res.status(200).sendFile(`${fileName}.html`)
        }
        else {
            return res.status(404).send({
                status: {
                    code: 404,
                    message: `${fileName} not found`,
                },
            });
        }
    })

    router.get("/jobmanager", function (req, res) {
        res.status(200).sendFile("./_cache/jobmanager.html")
    })


}
