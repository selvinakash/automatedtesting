var config = {
    'xpath': {
        'volume': {
            'path': 'article>front>article-meta>volume',
            'action': {
                'regex': new RegExp('^([0-9]+)$', 'gi'),
                'replace': '.$1'
            }
        },
        'project': {
            'path': 'book>book-meta>book-id:first, article>front>journal-meta>journal-id:first',
            'action': {
                'regex': new RegExp('^.*\/([A-Z]+(\.[0-9]+)?).*$', 'gi'),
                'replace': '$1'
            }
        },
        'issue': {
            'path': 'article>front>article-meta>issue',
            'action': {
                'regex': new RegExp('^([0-9]+)$', 'gi'),
                'replace': '.$1'
            }
        }
    },
    'evaluate': {
        'YYYY': '(new Date).getFullYear()',
        'MM': '("0" + ((new Date).getMonth() + 1)).slice(-2)',
        'DD': '("0" + (new Date).getDate()).slice(-2)'
    },
    /* 'evaluate': {
        'YYYY': '2017',
        'MM': '12',
        'DD': '01'
    }, */
    'variables': {},
    'validate': {
        'zip': '{project}{volume}{issue}\.20[0-9]{6}.zip', //'{project}{volume}{issue}.{YYYY}{MM}{DD}.zip',
        'doi': '^{project}({volume}{issue})?(.([0-9]{2}[a-z]{2,3}|c[0-9]{1,2}|[a-z]{3}|[0-9]{5}\.[a-z]{3}))?$',
        'xml': '{project}{volume}{issue}\.20[0-9]{6}/xml/fulltext/({project}{volume}{issue}|{doi}).xml', //'{project}{volume}{issue}.{YYYY}{MM}{DD}/xml/fulltext/({project}{volume}{issue}|{doi}).xml',
        'asset': '{project}{volume}{issue}\.20[0-9]{6}/figures/{doi}_(ex|fig|inline|map|photo|table)[0-9]+.svg', //'{project}{volume}{issue}.{YYYY}{MM}{DD}/figures/{doi}_(ex|fig|inline|map|photo|table)[0-9]+.svg',
        'assetalt': '{project}{volume}{issue}\.20[0-9]{6}/figures/{doi}_(ex|fig|inline|map|photo|table)[0-9]+.(psd|ai)', //'{project}{volume}{issue}.{YYYY}{MM}{DD}/figures/{doi}_(ex|fig|inline|map|photo|table)[0-9]+.(psd|ai)',
        'optional': '{project}{volume}{issue}\.20[0-9]{6}/({project}{volume}{issue}|{doi})\.figure-comparison.pdf'
	}
}

function readZip($file) {
    var zipTreeObj = {
        'folder': [],
        'file': {
            'xml': [],
            'asset': []
        },
        'fileInfo': {
            'name': $file.name,
            'loadStart': new Date(),
            'loadEnd': new Date()
        },
        'zip': {}
    }

    zipObj = zipTreeObj.zip;
    JSZip.loadAsync($file)
        .then(function ($zipFile) {
            $result.find('tr').append('<td><span class="mono">Readable&nbsp;</span><span class="status check">&check;</span></td>');
            // Step 1. this is like Object.values(zip.files) which is not yet implemented everywhere
            var entries = Object.keys($zipFile.files).map(function (name) {
                return $zipFile.files[name];
            });

            // Step 2.
            var listOfPromises = entries.map(function (entry) {
                if (entry.dir) {
                    var dirNameArr = entry.name.replace(/\/$/, '').split('/');
                    if (dirNameArr.length == 1) {
                        zipTreeObj.zip['root'] = entry.name
                    }
                    return [entry.name, 'folder', 'folder', ''];
                }
                else if (/\.xml$/i.test(entry.name)) {
                    return entry.async("text").then(function (xmlString) {
                        // we bind the two together to be able to match the name and the content in the last step
                        return [entry.name, 'file', 'xml', xmlString];
                    });
                }
                else {
                    return [entry.name, 'file', 'asset', ''];
                }
            });

            // Step 3. Wait for all promise
            var promiseOfList = Promise.all(listOfPromises);

            // 4.
            return promiseOfList
                .then(function (list) {
                    // here, list is a list of [name, content]
                    // let's transform it into an object for easy access
                    var result = list.reduce(function (accumulator, current) {
                        var currentName = current[0];
                        var currentValue = current[1];
                        if (current[1] == 'folder') {
                            zipTreeObj[current[1]].push(current[0]);
                        }
                        else if (current[2] == 'asset') {
                            zipTreeObj[current[1]][current[2]].push(current[0]);
                        }
                        else {
                            zipTreeObj[current[1]][current[2]].push({
                                'path': current[0],
                                'contents': current[3]
                            });
                        }
                        return accumulator;
                    }, {} /* initial value */);
                    $logs.append('<p>package loaded in ' + (zipTreeObj.fileInfo.loadEnd - zipTreeObj.fileInfo.loadStart) + 'ms)');
                    zipTreeObj.fileInfo.loadEnd = new Date();
                    return zipTreeObj;
                })
                .catch(function (e) {
                    $result.append('<tr><td>' + e.toString() + '<td><span class="mono">Readable&nbsp;</span><span class="status cross">&cross;</span></td></tr>');
                });
        })
        .then(function (zipTree) {
            $('input[type=file]').val(null);
            validatePackage(zipTree);
        })
        .catch(function (e) {
            $result.append('<tr><td><span class="mono">Readable&nbsp;</span><span class="status cross">&cross;</span></td></tr>');
        });

}
function validatePackage(zipTreeObj) {

    // check 1: need to have atleast 1 XML file
    if (zipTreeObj.file.xml.length == 0) {
        $logs.append($("<div>", {
            "class": "alert alert-danger",
            text: "Error: No XML found, process aborted"
        }));
        return false;
    }
    // loop through XML files
    zipTreeObj.file.xml.forEach(function (xmlInfo, xmlIndex) {
        $logs.append('<p>processing ' + xmlInfo.path + '&hellip;</p>');
        xmlDoc = $.parseXML(xmlInfo.contents);
        $xml = $(xmlDoc);
        if (!$xml) {
            $logs.append($("<div>", {
                "class": "alert alert-danger",
                text: "Error: Unable to load XML found, process aborted"
            }));
            return false;
        }
        // collect the variables
        for (var key in config.xpath) {
            var tempVar = $xml.find(config.xpath[key]['path']).text();
            if (config.xpath[key]['action']) {
                var myRegex = config.xpath[key]['action']['regex'];
                tempVar = tempVar.replace(myRegex, config.xpath[key]['action']['replace']);
            }
            config.variables[key] = tempVar;
        }
        for (var key in config.evaluate) {
            config.variables[key] = "" + eval(config.evaluate[key]);
        }
        // starting the checks
        // check the zip file name
        if (xmlIndex == 0){
            addRow($result, zipTreeObj.fileInfo.name, 'true', isNameValid('zip', zipTreeObj.fileInfo.name), 'zip', 'zip');
        }

        var assestsArr = zipTreeObj.file.asset;
        $xml.find('book-part[book-part-type="chapter"], article').each(function (chIndex, rootNode) {
            $(rootNode).find('book-part-id, article-id:first').each(function (doiIndex, doiNode) {
                var doiValue = $(doiNode).text().replace(/^.*\/(.*)$/gi, "$1");
				config.variables['doi'] = doiValue;
				if (chIndex == 0){
					addRow($result, xmlInfo.path, 'true', isNameValid('xml', xmlInfo.path), 'xml', 'xml');
                }
                if (isNameValid('doi', doiValue)){
                    addRow($result, doiValue, true, true, 'doiCorrect', 'doi');
                }
				else{
                    addRow($result, doiValue, true, false, 'doiInCorrect', 'doi');
				}
				var graphicFileArray = [];
                $(rootNode).find('graphic, inline-graphic').each(function () {
					var graphicFile = zipTreeObj.zip.root + $(this).attr('xlink:href');
                    if (graphicFileArray.indexOf(graphicFile) > -1){
						return true;
					}
					else{
						graphicFileArray.push(graphicFile);
					}
                    $logs.append('<p>processing ' + graphicFile + '</p>');
                    var presentInPackage = false;
                    var followsNameConven = false;
                    var assertIndex = assestsArr.indexOf(graphicFile);
                    if (assertIndex > -1) {
                        presentInPackage = true;
                        assestsArr.splice(assertIndex, 1);
                    }
                    addRow($result, graphicFile, presentInPackage, isNameValid('asset', graphicFile), 'asset', 'asset');
                    graphicFile = graphicFile.replace('.svg', '.psd');
                    var assertIndex = assestsArr.indexOf(graphicFile);
                    presentInPackage = false;
                    if (assertIndex > -1) {
                        presentInPackage = true;
                        assestsArr.splice(assertIndex, 1);
                        addRow($result, graphicFile, presentInPackage, isNameValid('assetalt', graphicFile), 'assetAlt', 'assetalt');
                    }
                    graphicFile = graphicFile.replace('.psd', '.ai');
                    var assertIndex = assestsArr.indexOf(graphicFile);
                    if (assertIndex > -1) {
                        presentInPackage = true;
                        assestsArr.splice(assertIndex, 1);
                        addRow($result, graphicFile, presentInPackage, isNameValid('assetalt', graphicFile), 'assetAlt', 'assetalt');
                    }
                    if (!presentInPackage){
                        addRow($result, graphicFile, presentInPackage, isNameValid('assetalt', graphicFile), 'assetAltNotPresent', 'assetalt');
                    }
                })
            });
        });
        //console.log(xmlInfo)
    });
    if (zipTreeObj.file.asset.length > 0){
        zipTreeObj.file.asset.forEach(function(assetNotReferred){
			if (isNameValid('optional', assetNotReferred)){
				addRow($result, assetNotReferred, true, true, 'optional');
			}
			else{
				addRow($result, assetNotReferred, false, false, 'assetNotReferred');
			}
        });
    }
	
	var element = document.getElementById('resultContainer');
	var eleHeight = $(element).height();
	$(element).css('height', '100%').css('overflow', '');
	html2pdf(element, {
		margin:       1,
		filename:     $('#resultContainer').attr('data-package-name').replace(/\.zip$/gi, '') + '.pdf',
		image:        { type: 'jpeg', quality: 0.98 },
		html2canvas:  { dpi: 192, letterRendering: true },
		jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
	});
	$(element).css('height', eleHeight).css('overflow', 'auto');
}

function isNameValid(type, fileName) {
    var asstRegexString = config.validate[type];
    var varArr = asstRegexString.match(/(?<={)[a-z]+(?=})/gi);
    varArr.forEach(element => {
        var tmpRegex = new RegExp('\{' + element + '\}', 'gi');
        asstRegexString = asstRegexString.replace(tmpRegex, config.variables[element]);
    });
    var asstRegex = new RegExp(asstRegexString, 'gi');
    if (asstRegex.test(fileName)) {
        return true;
    }
    else {
        return false;
    }
}
function addRow(nodeToAppend, fileName, status1, status2, className, assetType) {
    var rowString = '<tr><td class="' + className + '">' + fileName + '</td><td class="flags">';
    if (status1) {
        rowString += '<span class="status check">&check;</span>';
    }
    else {
        rowString += '<span class="status cross">&cross;</span>';
    }
    rowString += '</td><td class="flags">';
    if (status2) {
        rowString += '<span class="status check">&check;</span>';
    }
    else {
        rowString += '<span class="status cross">&cross;</span>';
    }
    rowString += '</td></tr>';
    $result.append(rowString);
}
