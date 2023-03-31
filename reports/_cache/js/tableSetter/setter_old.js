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

$.fn.wordify = function() {
    this.find(":not(iframe,textarea)").addBack().contents().filter(function() {
        return this.nodeType === 3;
    }).each(function() {
        var textnode = $(this);
        var text = textnode.text();
        text = text.replace(/([^\s-.,;:!?()[\]{}<>"]+)/g, '<span>$1</span>');
        textnode.replaceWith(text);
    });
    return this;
};

/**
 * https://medium.freecodecamp.org/three-ways-to-find-the-longest-word-in-a-string-in-javascript-a2fb04c9757c
 * @param {*} str
 */
function longestWord(str) {
    var longestWord = str.split(' ').sort(function(a, b) { return b.length - a.length; });
    return longestWord[0]; //.length;
}

/**
 *
 * @param {*} cellText
 */
function analyseDataType(cellText, colSubTypeObj) {
    var subType = ' ';
    if (/^[0-9\,\.\(\)\[\]\xB1\u2013\u2014\u2212 \/]+$/gi.test(cellText)) {
        if (/[0-9\.]+\s*\u{B1}\s*[0-9\.]+/gi.test(cellText)) {
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
function analyseData(currCell, colIndex) {
    if (typeof(colDataType[colIndex]) == 'undefined') {
        colDataType[colIndex] = {
            'minWidth': 9999999999999,
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
            }
        };
    }
    var cellText = $(currCell).text();
    var dataObj = analyseDataType(cellText, colDataType[colIndex]['data-subtype']);
    currCell.setAttribute('data-type', dataObj.type);
    currCell.setAttribute('data-sub-type', dataObj.subType);
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
    if (dataObj.type == 'text') {
        colDataType[colIndex].text = colDataType[colIndex].text + 1;
        longestWordString = longestWord(cellText);
        var range = rangy.createRange();
        var searchScopeRange = rangy.createRange();
        searchScopeRange.selectNodeContents(currCell);
        var options = {
            caseSensitive: false,
            wholeWordsOnly: false,
            withinRange: searchScopeRange,
            direction: "forward" // This is redundant because "forward" is the default
        };
        range.selectNodeContents(currCell);
        range.findText(longestWordString, options)
        range.select();
        dataObj['minWidth'] = getSelectionWidth();
        if (colIndex == 0) console.log(dataObj.minWidth, longestWordString);
    } else {
        colDataType[colIndex].data = colDataType[colIndex].data + 1;
        dataObj['minWidth'] = dataObj['maxWidth'];
    }
    currCell.setAttribute('data-max-width', dataObj.maxWidth);
    currCell.setAttribute('data-min-width', dataObj.minWidth);
    colDataType[colIndex]['minWidth'] = Math.min(colDataType[colIndex].minWidth, dataObj['minWidth']),
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
                        var dataObj = analyseData(currCell, col);
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
 * scan through the given cells to do the following
 * 1) determine the type of data present and add attribute data-type
 *      a. text
 *      b. decimal
 *      c. paren
 *      d. plus
 *      e. plusmn
 *      f. minus
 *      g. ndash
 *      h. mdash
 *      i. comma
 * 2) determine the min/max width of columns - the min width will be the width of a single word that occupies most space
 */
function scanCells() {
    return new Promise(function(resolve, reject) {
        console.log('scanCells');
        resolve(true);
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
                return scanCells();
            })
            .then(function(d) {
                console.log('done');
            })
            .catch(function(e) {
                console.log('error');
            })
    });
})();