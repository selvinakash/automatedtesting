
const { JSDOM } = require('jsdom');
const fs = require('fs')
let chai = require('chai');
let chaiHttp = require('chai-http');
chai.use(chaiHttp);
const dotenv = require('dotenv');
dotenv.config();
var path = require('path');
var libxmljs = require("libxmljs"),
   HtmlDiffer = require('html-differ').HtmlDiffer,
   unirest = require('unirest');
const DiffMatchPatch = require('diff-match-patch');
const { expect } = require('@playwright/test');
const dmp = new DiffMatchPatch();
var contextObject = {};

var resetData = async function (config, xmlFile, testName, filePath) {
    try {
        return new Promise(function (resolve, reject) {
            chai.request(process.env.siteName)['post']("/api/uploadxml?apiKey=36ab61a9-47e1-4db6-96db-8b95a9923599")
                .field('customer', config[testName]["articletotest"][xmlFile]["customer"])
                .field('project', config[testName]["articletotest"][xmlFile]["project"])
                .attach('xmlFile', filePath)
                .end(async function (err, response) {
                    resolve(response)
                });
            console.log(config[testName]["articletotest"][xmlFile]["doi"] + " file uploaded successfully")
        })
    }
    catch (e) {
        console.log(e)
    }
}

var xmlCompare = async function (pageUrl,fileName) {
    var url = pageUrl.replace(/(.*?)doi(.*?)\&type\=journal/g, 'doi$2')
    var getXML = {}
    getXML.url = process.env.siteName + "/api/getxml/?" + url + '&apiKey=36ab61a9-47e1-4db6-96db-8b95a9923599';
    await interact(getXML)
        .then(async function (data) {
            var file = data.message.response;
            var doi = pageUrl.replace(/(.*?)doi=(.*?)\&customer(.*)/g, '$2')
            var element = fs.readFileSync(path.resolve('./expected-xml/'+ fileName +"/" + doi + '.xml'), 'utf-8')
            var xmlDoc = libxmljs.parseXml(file);
            var xmlDoc1 = libxmljs.parseXml(element);
            xmlDoc.find('//start-date | //end-date | //useremail | //end-time | //username | //start-time | //on | //to').forEach(function (index) {
                index.text("")
            })
            xmlDoc1.find('//start-date |  //useremail | //end-date | //end-time | //username | //start-time | //on | //to').forEach(function (index) {
                index.text("")
            })
            xmlDoc.find('//*[@specific-use="historyContent"]').forEach(function (index) {
                index.remove()
            })
            xmlDoc1.find('//*[@specific-use="historyContent"]').forEach(function (index) {
                index.remove()
            })
            xmlDoc1.find('//*[@id]').forEach(function (index) {
                index.attr('id').remove()
            })
            xmlDoc1.find('//*[@rid]').forEach(function (index) {
                index.attr('rid').remove()
            })
            xmlDoc1.find('//*[@specific-use]').forEach(function (index) {
                index.attr('specific-use').remove()
            })
            xmlDoc1.find('//*[@data-title]').forEach(function (index) {
                index.attr('data-title').remove()
            })
            xmlDoc1.find('//*[@data-time]').forEach(function (index) {
                index.attr('data-time').remove()
            })
            xmlDoc1.find('//*[@data-node-xpath]').forEach(function (index) {
                index.attr('data-node-xpath').remove()
            })
            xmlDoc1.find('//*[@data-cid]').forEach(function (index) {
                index.attr('data-cid').remove()
            })
            xmlDoc.find('//*[@id]').forEach(function (index) {
                index.attr('id').remove()
            })
            xmlDoc.find('//*[@rid]').forEach(function (index) {
                index.attr('rid').remove()
            })
            xmlDoc.find('//*[@id]').forEach(function (index) {
                index.attr('id').remove()
            })
            xmlDoc.find('//*[@specific-use]').forEach(function (index) {
                index.attr('specific-use').remove()
            })
            xmlDoc.find('//*[@data-title]').forEach(function (index) {
                index.attr('data-title').remove()
            })
            xmlDoc.find('//*[@data-time]').forEach(function (index) {
                index.attr('data-time').remove()
            })
            xmlDoc.find('//*[@data-node-xpath]').forEach(function (index) {
                index.attr('data-node-xpath').remove()
            })
            xmlDoc.find('//*[@data-cid]').forEach(function (index) {
                index.attr('data-cid').remove()
            })
            xmlDoc.find('//*[@data-userid]').forEach(function (index) {
                index.attr('data-userid').remove()
            })
            xmlDoc.find('//*[@data-username]').forEach(function (index) {
                index.attr('data-username').remove()
            })
            xmlDoc1.find('//*[@data-userid]').forEach(function (index) {
                index.attr('data-userid').remove()
            })
            xmlDoc1.find('//*[@data-username]').forEach(function (index) {
                index.attr('data-username').remove()
            })
            file = xmlDoc.toString(false)
            element = xmlDoc1.toString(false)


            file = file.replace(/\s?xmlns:xlink\=\"(.*?)\"/g, '');
            file = file.replace(/\s?xlink:title\=\"(.*?)\"/g, '');
            file = file.replace(/\s?xlink:href\=\"(.*?)\"/g, '');
            file = file.replace(/\s?xlink:actuate\=\"(.*?)\"/g, '');
            file = file.replace(/\s?xlink:type\=\"(.*?)\"/g, '');
            file = file.replace(/\sdata-alt-src=\"(.*?)\"/g, '')
            file = file.replace(/\sdata-focusout-data=\"(.*?)\"/g, '')
            file = file.replace(/\sdata-focusin-data=\"(.*?)\"/g, '')
            file = file.replace(/\sdata-mce-href=\"(.*?)\"/g, '')
            file = file.replace(/pub-type=\"ppub\"\>\<day\>(.*?)\<\/day\>/g, 'pub-type="ppub"\><day>00</day>')
            file = file.replace(/pub-type=\"epub\"\>\<day\>(.*?)\<\/day\>/g, 'pub-type="epub"\><day>00</day>')
            file = file.replace(/\sdata-id\=\"aff(.*?)\"/g, " data-id='aff12345'")
            file = file.replace(/\sxlink\:fn-type\=\"(.*?)\"/g, "")
            file = file.replace(/\sxlink:role\=\"(.*?)\"/g, "")
            file = file.replace(/\sdata-edited-node=\"true\"/g, "")

            element = element.replace(/\s?xmlns:xlink\=\"(.*?)\"/g, '');
            element = element.replace(/\s?xlink:title\=\"(.*?)\"/g, '');
            element = element.replace(/\s?xlink:href\=\"(.*?)\"/g, '');
            element = element.replace(/\s?xlink:type\=\"(.*?)\"/g, '');
            element = element.replace(/\s?xlink:actuate\=\"(.*?)\"/g, '');
            element = element.replace(/\sdata-alt-src=\"(.*?)\"/g, '')
            element = element.replace(/\sdata-focusout-data=\"(.*?)\"/g, '')
            element = element.replace(/\sdata-focusin-data=\"(.*?)\"/g, '')
            element = element.replace(/\sdata-mce-href=\"(.*?)\"/g, '')
            element = element.replace(/pub-type=\"ppub\"\>\<day\>(.*?)\<\/day\>/g, 'pub-type="ppub"\><day>00</day>')
            element = element.replace(/pub-type=\"epub\"\>\<day\>(.*?)\<\/day\>/g, 'pub-type="epub"\><day>00</day>')
            element = element.replace(/\sdata-id\=\"aff(.*?)\"/g, " data-id='aff12345'")
            element = element.replace(/\sxlink\:fn-type\=\"(.*?)\"/g, "")
            element = element.replace(/\sxlink:role\=\"(.*?)\"/g, "")
            element = element.replace(/\sdata-edited-node=\"true\"/g, "")

            fs.writeFileSync(path.resolve('./xml-compare/'+ fileName + "/" + doi + '_formattedNew-editorComponents.xml'), file, {
                mode: 0o755
            });
            fs.writeFileSync(path.resolve('./xml-compare/'+ fileName + "/" + doi + '_formattedold-editorComponents.xml'), element, {
                mode: 0o755
            });

            var options = {
                // ignoreAttributes: ["id", "xmlns:mml", "xmlns:xsi", "xmlns:xs", "xmlns:xlink", "data-tooltip-id", "material-tooltip",
                //   "data-current-user", "data-structure-content", "data-stage", "data-stage-name", "data-user-role", "data-user-access-level",
                //   "data-proof-config-id", "data-node-xpath", "data-title", "start-date", "xlink:href", "xlink:title", "username", "xlink:actuate", "data-id", "data-proof-prefix", "data-time", "time-notice", "data-assignee-changed", "data-skip-project", "data-role", "data-project", "data-label"
                // ],
                ignoreAttributes: ["data-node-xpath", "data-title", "data-id", "start-date", "xlink:actuate", "xlink:href", "xlink:title", "username", "xlink:actuate", "id", "alt"],
                compareAttributesAsJSON: [],
                ignoreWhitespaces: true,
                ignoreComments: true,
                ignoreEndTags: false,
                ignoreDuplicateAttributes: false
            };
            var overallChanges = '';
            var htmlDiffer = new HtmlDiffer(options);
            var diff = htmlDiffer.diffHtml(element, file);
            var actDiff = 0;
            var changedData = '';
            for (const iterator of diff) {
                if (iterator.added) {
                    // console.log("Data added " + iterator.value)
                    changedData += "Data added: " + iterator.value + '\n';
                    actDiff++;
                } else if (iterator.removed) {
                    // console.log("Data removed " + iterator.value)
                    changedData += "Data removed: " + iterator.value + '\n';
                    actDiff++;
                }
            }
            if (actDiff > 0) {
                overallChanges += changedData + '\n' + '------------------------------------------------------------\n';
                fs.writeFileSync(path.resolve('./xml-compare/'+ fileName + "/" + fileName + "-overallChanges.txt"), overallChanges, {
                    mode: 0o755
                });
            }
            changedData = '';
            d = dmp.diff_main(element, file);
            /* number of changes */
            var c = (d && d.length) ? d.length : 0;
            /* converting those diff to html */
            var r = dmp.diff_prettyHtml(d);

            while (r.match(/(<[^>]*)(<(?:(?:ins)|(?:del))[^>]*>.*?<\/(?:(?:ins)|(?:del))>)([^<]*>)/)) {
                r = r.replace(/(<[^>]*)(<(?:(?:ins)|(?:del))[^>]*>.*?<\/(?:(?:ins)|(?:del))>)([^<]*>)/, '$1 $3 $2')
            }
            /* writing those in a html */
            f = path.resolve('./xml-compare/'+ fileName + "/" + fileName + "-diffFile.html")
            fs.writeFileSync(f, r);
            expect(actDiff).toEqual(0);
        })
}

function interact(request) {
    return new Promise(function (resolve, reject) {
        try {
            var headers = request.headers ? headers : {
                "cache-control": "no-cache"
            };
            var method = request.method ? request.method : 'GET';
            var req = unirest(method, request.url);
            if (request.query) {
                req.send(request.query);
            }
            req.headers(headers);
            req.end(function (res) {
                if (res.error) {
                    reject({
                        status: {
                            code: res.code,
                            message: "failed"
                        },
                        message: {
                            error: res.error
                        }
                    });
                } else {
                    resolve({
                        status: {
                            code: 200,
                            message: "success"
                        },
                        message: {
                            response: res.body
                        }
                    });
                }
            });
        }
        catch (err) {
            console.log(err);
        }
    });
}

exports.resetData = resetData;
exports.xmlCompare = xmlCompare;


