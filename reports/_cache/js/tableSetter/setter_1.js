/** global variable */
var colDataType = {}; // store info about a particular column and its data types
var range = '';

/**
 * https://stackoverflow.com/questions/12603397/calculate-width-height-of-the-selected-text-javascript
 */
function getSelectionWidth() {
    var sel = document.selection,
        range;
    var width = 0; //, height = 0;
    if (sel) {
        if (sel.type != "Control") {
            range = sel.createRange();
            width = range.boundingWidth;
            //height = range.boundingHeight;
        }
    } else if (window.getSelection) {
        sel = window.getSelection();
        if (sel.rangeCount) {
            range = sel.getRangeAt(0).cloneRange();
            if (range.getBoundingClientRect) {
                var rect = range.getBoundingClientRect();
                width = rect.right - rect.left;
                //height = rect.bottom - rect.top;
            }
        }
    }
    //return { width: width , height: height };
    return width;
}

/**
 * in the given element (cell), select the words from wordArr and call the getSelectionWidth function to determine the min width
 * @param {DOMElement} ele
 * @param {Array} wordArr
 */
function getMinWidth(ele, wordArr) {
    if (typeof(wordArr) === 'string') {
        wordArr = [].push(wordArr);
    }
    var minWidth = 0;
    var range = rangy.createRange();
    var searchScopeRange = rangy.createRange();
    searchScopeRange.selectNodeContents(ele);
    var options = {
        caseSensitive: false,
        wholeWordsOnly: false,
        withinRange: searchScopeRange,
        direction: "forward" // This is redundant because "forward" is the default
    };
    wordArr.forEach(function(currWord) {
        range.selectNodeContents(ele);
        range.findText(currWord, options)
        range.select();
        minWidth = Math.max(minWidth, getSelectionWidth());
    });
    return minWidth;
}

/**
 * https://medium.freecodecamp.org/three-ways-to-find-the-longest-word-in-a-string-in-javascript-a2fb04c9757c
 * @param {string} str
 */
function longestWord(str) {
    var longestWordArr = str.split(' ').sort(function(a, b) { return b.length - a.length; });
    var wholeArr = [];
    var tlength = 0;
    for (var i = 0; i < longestWordArr.length; i++) {
        if (tlength < longestWordArr[i].length) {
            tlength = longestWordArr[i].length;
        }
    }
    for (var j = 0; j < longestWordArr.length; j++) {
        if (longestWordArr[j].length == tlength) {
            wholeArr.push(longestWordArr[j]);
        }
    }
    return wholeArr;
}

/**
 *
 * @param {string} cellText
 * @param {object} colSubTypeObj
 */
function analyseDataType(cellText, colSubTypeObj) {
    var subType = ' ';
    if (/^[0-9\,\.\(\)\[\]\xB1\u2013\u2014\u2212 \/]+$/gi.test(cellText)) {
        if (/[0-9\.]+\s*\xB1\s*[0-9\.]+/gi.test(cellText)) {
            subType += 'plusmn ';
            colSubTypeObj['plusmn'] = colSubTypeObj['plusmn'] + 1;
        } else if (/[0-9\.]+\s*\+\s*[0-9\.]+/gi.test(cellText)) {
            subType += 'plus ';
            colSubTypeObj['plus'] = colSubTypeObj['plus'] + 1;
        } else if (/[0-9\.]+\s*[\-\u2013\u2014\u2212]\s*[0-9\.]+/gi.test(cellText)) {
            subType += 'ndash ';
            colSubTypeObj['ndash'] = colSubTypeObj['ndash'] + 1;
        } else if (/^[0-9\.\,]+/gi.test(cellText)) {
            subType += 'decimal ';
            colSubTypeObj['decimal'] = colSubTypeObj['decimal'] + 1;
        } else if (/[0-9\.]+\s?\(.*?\)(?:[^a-z])?/gi.test(cellText)) {
            subType += 'paren ';
            colSubTypeObj['paren'] = colSubTypeObj['paren'] + 1;
        }
        dataType = 'data';
    } else if (/^\s*$/gi.test(cellText)) {
        subType = ' empty ';
        dataType = 'text';
    } else {
        subType = ' text ';
        dataType = 'text';
    }
    return ({
        'type': dataType,
        'subType': subType
    });
}


/**
 *
 * @param {*} cellText
 */
function analyseData(currCell, colIndex, headOrBody) {
    if (typeof(colDataType[colIndex]) == 'undefined') {
        colDataType[colIndex] = {
            'minWidth': 0,
            'maxWidth': 0,
            'data': 0,
            'text': 0,
            'data-subtype': {
                'plusmn': 0,
                'ndash': 0,
                'mdash': 0,
                'minus': 0,
                'decimal': 0,
                'paren': 0,
                'comma': 0,
                'plus': 0
            },
            'data-left-part-width': 0,
            'data-right-part-width': 0
        };
    }
    var cellText = $(currCell).text();
    //var dataObj = analyseDataType(cellText, colDataType[colIndex]['data-subtype']);
    //=============
    var subType = ' ';
    if (headOrBody == 'thead') {
        subType = ' text ';
        dataType = 'text';
    } else if (/^[0-9\,\.\(\)\[\]\xB1\u2013\u2014\u2212 \/]+$/gi.test(cellText)) {
        if ((typeof(colDataType[colIndex - 1]) != 'undefined') && (colDataType[colIndex - 1]['data-type'] == 'text')) {

        } else if (/[0-9\.]+\s*\xB1\s*[0-9\.]+/gi.test(cellText)) {
            subType += 'plusmn ';
            colDataType[colIndex]['data-subtype']['plusmn'] = colDataType[colIndex]['data-subtype']['plusmn'] + 1;
        } else if (/[0-9\.]+\s*\+\s*[0-9\.]+/gi.test(cellText)) {
            subType += 'plus ';
            colDataType[colIndex]['data-subtype']['plus'] = colDataType[colIndex]['data-subtype']['plus'] + 1;
        } else if (/[0-9\.]+\s*[\-\u2013\u2014\u2212]\s*[0-9\.]+/gi.test(cellText)) {
            subType += 'ndash ';
            colDataType[colIndex]['data-subtype']['ndash'] = colDataType[colIndex]['data-subtype']['ndash'] + 1;
        } else if (/^[0-9\.\,]+/gi.test(cellText)) {
            subType += 'decimal ';
            colDataType[colIndex]['data-subtype']['decimal'] = colDataType[colIndex]['data-subtype']['decimal'] + 1;
        } else if (/[0-9\.]+\s?\(.*?\)(?:[^a-z])?/gi.test(cellText)) {
            subType += 'paren ';
            colDataType[colIndex]['data-subtype']['paren'] = colDataType[colIndex]['data-subtype']['paren'] + 1;
        }
        dataType = 'data';
    } else if (/^\s*$/gi.test(cellText)) {
        subType = ' empty ';
        dataType = 'text';
    } else {
        subType = ' text ';
        dataType = 'text';
    }
    //=============
    currCell.setAttribute('data-type', dataType);
    currCell.setAttribute('data-sub-type', subType);
    // max. width of the column will be the inner width of the cell
    // min. width of the column will be the width of longest (unbroken) word for a text type column,
    //    the width of the entire content if data type column
    var sel = rangy.getSelection();
    // assuming there is a <p> tag, get the width of its contents, else get the width of the cell
    if ((currCell.childElementCount == 1) && (currCell.firstElementChild.localName == 'p')) {
        sel.selectAllChildren(currCell.firstElementChild);
    } else {
        sel.selectAllChildren(currCell);
    }
    dataObj['maxWidth'] = getSelectionWidth();
    // if the cell contains only text then determine the largest word and find its width
    // if more than one word has the same length then the max width of all the individual words becomes the min width
    if (dataObj.type == 'text') {
        colDataType[colIndex].text = colDataType[colIndex].text + 1;
        longestWordArr = longestWord(cellText); //TODO: break tag to be considered
        dataObj['minWidth'] = getMinWidth(currCell, longestWordArr);
        if (colIndex == 0) console.log(dataObj.minWidth, longestWordArr);
    } else {
        colDataType[colIndex].data = colDataType[colIndex].data + 1;
        dataObj['minWidth'] = dataObj['maxWidth'];
    }
    currCell.setAttribute('data-max-width', dataObj.maxWidth);
    currCell.setAttribute('data-min-width', dataObj.minWidth);
    colDataType[colIndex]['minWidth'] = Math.max(colDataType[colIndex].minWidth, dataObj['minWidth']);
    colDataType[colIndex]['maxWidth'] = Math.max(colDataType[colIndex].maxWidth, dataObj['maxWidth'])
    return dataObj;
}

/**
 * check if the given input passes the quality requirements before taking it for processing
 * 1) input cannot have @style/@font/@width, etc attributes
 * 2) cells - th/td - cannot have direct text nodes, should be wrapped in <p> or similar nodes
 * 3) cells cannot have space at start and end
 * 4) cells cannot have just <br/> as its content or should not have <br/> at the end
 */
function checkInputQuality() {
    return new Promise(function(resolve, reject) {
        console.log('checkInputQuality');
        resolve(true);
    });
}

function checkIfTableValid(tbl, headOrBody) {
    return new Promise(function(resolve, reject) {
        var headRowsLen = 0;
        var rows = '';
        if (tbl.tHead) {
            if (headOrBody == 'thead') {
                rows = tbl.tHead.rows;
            }
            headRowsLen = rows.length;
        }
        if (tbl.tBodies && tbl.tBodies[0] && (headOrBody == 'tbody')) {
            rows = tbl.tBodies[0].rows;
        }
        var hasErrors = [];

        // total rows and columns
        var totalRows = rows.length;
        var totalColumns = 0;
        for (var row = 0; row < rows.length; row++) {
            var cells = rows[row].cells;
            var cols = 0;
            for (var col = 0; col < cells.length; col++) {
                var cell = rows[row].cells[col];
                var colspan = parseInt(cell.colSpan);
                if (colspan > 1) {
                    cols += colspan;
                } else {
                    cols++;
                }
            }
            totalColumns = Math.max(totalColumns, cols);
        }

        var cells = {};
        cells.init = function(row, col, options) {
            cells[row + ':' + col] = $.extend({
                row: row,
                col: col,
                count: 0
            }, options);
        }
        cells.update = function(row, col, options) {
            var cell = cells[row + ':' + col];
            if (!cell) {
                hasErrors.push('cell outside of table dimensions (cell ' + (row + 1) + ':' + (col + 1) + ' is outside of allowed table size ' + totalRows + ':' + totalColumns + ')');
                return;
            }
            cells[row + ':' + col].count++;
            if (options) {
                if (options.element) {
                    var currCell = options.element;
                    if (!options.element.getAttribute('data-row-index') || !options.element.getAttribute('data-col-index')) {
                        options.element.setAttribute('data-row-index', row);
                        options.element.setAttribute('data-col-index', col);
                        // check type of data it contains and add necessary attribute
                        var dataObj = analyseData(currCell, col, headOrBody);
                    }
                }
                cells[row + ':' + col] = $.extend(cells[row + ':' + col], options);
            }
        }
        cells.get = function(row, col) {
            return cells[row + ':' + col];
        }

        var colspans = {};
        colspans.add = function(row, col, count) {
            for (var coladd = 0; coladd < count; coladd++) {
                colspans[row + ':' + (col + coladd)] = true;
            }
        };
        colspans.check = function(row, col) {
            return colspans[row + ':' + col];
        };

        var rowspans = {};
        rowspans.add = function(row, col, count) {
            for (var rowadd = 0; rowadd < count; rowadd++) {
                rowspans[(row + rowadd) + ':' + col] = true;
            }
        };
        rowspans.check = function(row, col) {
            return rowspans[row + ':' + col];
        };

        // init cell matrix
        for (var row = 0; row < totalRows; row++) {
            for (var col = 0; col < totalColumns; col++) {
                cells.init(row, col);
            }
        }

        for (var row = 0; row < rows.length; row++) {
            var colskip = 0;
            var rowskip = 0;
            for (var col = 0; col < totalColumns; col++) {
                // check if this cell is pushed by a colspan
                if (colspans.check(row, col)) continue;

                // check if this cell is pushed by a rowspan
                if (rowspans.check(row, col)) {
                    rowskip++;
                    continue;
                }

                //console.log("row: " + row + " - col: " + (col - colskip - rowskip));
                var cell = rows[row].cells[col - colskip - rowskip];
                if (!cell) continue;

                var rowspan = parseInt(cell.rowSpan);
                var colspan = parseInt(cell.colSpan);

                cells.update(row, col, {
                    element: cell
                });
                if (colspan > 1) {
                    colskip += colspan - 1;
                    colspans.add(row, col + 1, colspan - 1);
                    for (var coladd = 1; coladd < colspan; coladd++) {
                        cells.update(row, col + coladd, {
                            element: cell
                        });
                    }
                }
                if (rowspan > 1) {
                    rowspans.add(row + 1, col, rowspan - 1);
                    for (var rowadd = 1; rowadd < rowspan; rowadd++) {
                        cells.update(row + rowadd, col, {
                            element: cell
                        });
                    }
                }
            }
        }

        for (var row = 0; row < totalRows; row++) {
            for (var col = 0; col < totalColumns; col++) {
                var cell = cells.get(row, col);
                if (cell.count == 1) {
                    // everything is fine
                } else if (cell.count == 0) {
                    hasErrors.push("cell " + (row + 1) + ':' + (col + 1) + " is missing");
                } else {
                    hasErrors.push("cell " + (row + 1) + ':' + (col + 1) + " is overlapping with rowspan (cell usage count of " + cell.count + ")");
                }
            }
        }

        if (hasErrors.length > 0) {
            reject({
                status: { code: 500, message: "failed" },
                message: {
                    'log': 'Table is invalid',
                    'error': hasErrors
                }
            });
        } else {
            resolve(true);
        }
    });
}

/**
 * validate table to ensure the columns, rows are valid and does not have extra/insufficient cells
 * https://stackoverflow.com/questions/14536492/validate-correctness-of-html-table-syntax-with-javascript
 *
 */
function validateTable() {
    return new Promise(function(resolve, reject) {
        var tbl = document.getElementsByTagName('table');
        if (!tbl[0]) {
            reject('table not found');
            return false;
        }
        tbl = tbl[0];
        checkIfTableValid(tbl, 'thead')
            .then(function() {
                return checkIfTableValid(tbl, 'tbody');
            })
            .then(function() {
                resolve(true);
            })
            .catch(function(e) {
                reject(e);
            });
        console.log('validateTable');
    });
}

/**
 * start the process when the window has loaded
 */
(function() {
    $(window).on('load', function() {
        console.log('window loaded');
        rangy.init();
        checkInputQuality().then(function(data) {
                return validateTable();
            })
            .then(function(d) {
                console.log('done');
            })
            .catch(function(e) {
                console.log('error');
            })
    });
})();