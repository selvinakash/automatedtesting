/** global variable */
var colDataType = {}; // store info about a particular column and its data types
var range = '';
var layoutOptionsArr = []; // will store the available widths in which the table can be typeset
var colStats = {
    'data': {
        'colIndex': [],
        'totalWidth': 0
    },
    'text': {
        'colIndex': [],
        'totalMinWidth': 0,
        'totalMaxWidth': 0
    },
    'empty': {
        'colIndex': [],
        'totalWidth': 0
    },
    'layout': {}
}

//https://regex101.com/r/QqIUEI/2
var spacePtn = "\u0020\u00A0\r\n\t";
var hyphenPtn = "\\-\u2013\u2212\u2014";
var dataRegEx = new RegExp('^([' + spacePtn + hyphenPtn + '\<]*[0-9]+)([\\.0-9]*[' + spacePtn + ']*)((to|\\(|\\+|[' + hyphenPtn + ']|\u00B1)?[0-9\\.\\,\\)' + spacePtn + hyphenPtn + ']*)?$', 'gi');
var dataRegEx = new RegExp('^([' + spacePtn + hyphenPtn + '\<]*[0-9]*)([\\.0-9]*[' + spacePtn + ']*)((to|\\(|\\+|[' + hyphenPtn + ']|\u00B1)?[0-9\\.\\,\\)' + spacePtn + hyphenPtn + ']+)?$', 'i');
var charPlusMn = '\xB1';
var charPlus = '+';
var charNDash = '\u2013';
var charMDash = '\u2014';
var charHyphen = '-';
var charMinus = '\u2212';
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
        }
    } else if (window.getSelection) {
        sel = window.getSelection();
        if (sel.rangeCount) {
            range = sel.getRangeAt(0).cloneRange();
            if (range.getBoundingClientRect) {
                var rect = range.getBoundingClientRect();
                width = rect.right - rect.left;
            }
        }
    }
    return width;
}

/**
 * in the given element (cell), select the words from wordArr and call the getSelectionWidth function to determine the min width
 * @param {DOMElement} ele
 * @param {Array} wordArr
 * @param {Boolean} flag
 */
function getMinWidth(ele, wordArr, flag) {
    var valueArray = [];
    if (typeof (wordArr) === 'string') {
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
    wordArr.forEach(function (currWord) {
        if (currWord == "") {
            minWidth = Math.max(minWidth, 0);
            valueArray.push(0);
        } else if (currWord != undefined) {
            range.selectNodeContents(ele);
            if (range.findText(currWord, options)) {
                range.select();
                var currSelWidth = getSelectionWidth();
                minWidth = Math.max(minWidth, currSelWidth);
                valueArray.push(currSelWidth);
            } else {
                console.log('cannot find currWord: ', currWord);
                // TODO: ??? failure handling
            }
        }
    });
    if (flag) {
        return valueArray;
    }
    return minWidth;
}

/**
 * https://medium.freecodecamp.org/three-ways-to-find-the-longest-word-in-a-string-in-javascript-a2fb04c9757c
 * @param {*} str
 */
function longestWord(str) {
    var longestWordArr = str.split(' ').sort(function (a, b) { return b.length - a.length; });
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
 * get more information about the cell
 * @param {DOMElement} currCell
 * @param {Integer} colIndex
 */
function analyseData(currCell, colIndex, headOrBody) {
    var colSpan = currCell.colSpan ? currCell.colSpan : 1;
    for (var ci = colIndex; ci < (colIndex + colSpan); ci++) {
        if (typeof (colDataType[ci]) == 'undefined') {
            colDataType[ci] = {
                'minWidth': 0,
                'maxWidth': 0,
                'dataLeftPartMaxWidth': 0,
                'dataRightPartMaxWidth': 0,
                'data': 0,
                'text': 0,
                'width': 0,
                'data-type': '',
                'data-sub-type': '',
                'borrowWidth': false,
                'widthWrapped': 0,
                'headerColSpan': 0
            };
        }
    }

    //var cellText = $('<div/>').html($(currCell).html().replace(/<br[^>]*>/, ' ')).text();
    var cellText = '';
    $(currCell).contents().each(function () {
        if ($(this)[0].nodeType == 3) {
            cellText += $(this).text();
        }
        else if (($(this).css('display') == 'block') && ($(this).prev().length > 0)) {
            cellText += ' ' + $(this).text();
        }
        else if ($(this)[0].nodeType == 1) {
            if ($(this)[0].nodeName == 'BR') { //|| ($(this).prev().length > 0)
                cellText += ' ';
            }
            cellText += $(this).text();
        }
    });
    // just to be sure we do not break at inappropriate places, replace normal space with nonbreaking space
    // that are before or after symbols, etc
    cellText = cellText.replace(/\s(?=[\=\+\-\>\<\u00B1\xB1\u2013\u2014\u2212\]\))|(?<=[\(\[\=\+\-\>\<\u00B1\xB1\u2013\u2014\u2212]) /g, "\u00A0");
    cellText = cellText.replace(/(?<=[\s\b])([a-z]) /gi, "$1\u00A0");
    var trimText = cellText.trim();
    var myArray = [];
    var dataType = '';
    var subType = '';
    // if the entire cell is empty or has only space in it
    if (/^[\s\u00A0]*$/gi.test(trimText)) {
        dataType = 'empty';
    } else {
        dataPartsArr = dataRegEx.exec(trimText);
        // if dataPartsArr is null, it means that the given cell is not of type 'data', mark it as 'text' cell
        if (dataPartsArr === null) {
            dataType = 'text';
        } else {
            /*
            the dataPartsArr will have 5 parts, for example, if the input is 1.2 (3 ± 4.567)
            dataPartsArr[0] => `1.2 (3 ± 4.567)` ==> input text
            dataPartsArr[1] => `1`               ==> integer part
            dataPartsArr[2] => `.2 `             ==> decimal part if present otherwise empty
            dataPartsArr[3] => `(3 ± 4.567)`     ==> optional parts
            dataPartsArr[4] => `(`               ==> data type identifier like `(`, `+`, `±`, etc
            if part 5 is present, then the alignment would be based on that character, except '(' where we prefer decimals
            */
            dataType = 'data';
            if (/[\u00B1\xB1\+\u2013\u2014\-\u2212]/.test(dataPartsArr[4])) {
                // anything before the above character is the left part and from that character till end is the right part
                var leftPart = dataPartsArr[1] + (dataPartsArr[2] ? dataPartsArr[2] : "");
                var rightPart = (dataPartsArr[3] ? dataPartsArr[3] : "");
                switch (dataPartsArr[4]) {
                    case charHyphen:
                        subType = 'hyphen';
                        break;
                    case charMDash:
                        subType = 'mdash';
                        break;
                    case charMinus:
                        subType = 'minus';
                        break;
                    case charNDash:
                        subType = 'ndash';
                        break;
                    case charPlus:
                        subType = 'plus';
                        break;
                    case charPlusMn:
                        subType = 'plusmn';
                        break;
                    default:
                        subType = 'decimal';
                        break;
                }
            } else {
                // the integer part alone becomes the left part and the remaining the right part
                // this ensures that 10 and 0.5 on rows A and B align on `0`
                var leftPart = (dataPartsArr[1] ? dataPartsArr[1] : "");
                var rightPart = dataPartsArr[2] + (dataPartsArr[3] ? dataPartsArr[3] : "");
                subType = 'decimal';
            }
            dataPartsArr = [leftPart, rightPart];
        }
    }
    var maxWidth = 0;
    var minWidth = 0;
    var numberMaxWidth = 0;
    // max. width of the column will be the inner width of the cell
    // min. width of the column will be the width of longest (unbroken) word for a text type column,
    //    the width of the entire content if data type column
    if ((dataType === 'text') || (dataType === 'empty') || (dataType === 'thead')) {
        // TODO: add checks for cases where data is empty
        // if the dataType is empty and the previous row current column is of type 'data' or 'text', change dataType
        if ((colDataType[colIndex]['data-type'] != 'empty') && (dataType === 'empty')) {
            dataType = colDataType[colIndex]['data-type'];
            subType = colDataType[colIndex]['data-sub-type'];
        }
        var sel = rangy.getSelection();
        var children = currCell.children;
        var childrenCount = children.length;
        // loop through the child nodes and get the max width a child node occupies
        for (i = 0; i < childrenCount; i++) {
            var currChild = children[i];
            if (currChild.innerText == '') {
                maxWidth = Math.max(maxWidth, 0);
            } else {
                sel.selectAllChildren(currChild);
                maxWidth = Math.max(maxWidth, getSelectionWidth());
            }
        }

        if (subType) {
            minWidth = maxWidth;
        } else {
            longestWordArr = longestWord(trimText);
            minWidth = getMinWidth(currCell, longestWordArr, false);
        }

    } else {
        // for 'data' type columns, calculate the left and right part widths
        // calculate the max of the left and right parts for the column by comparing with previous value of the column
        // TODO: add checks for cases when you dont have the left or right part
        var partWidths = getMinWidth(currCell, dataPartsArr, true);
        var leftPartWidth = partWidths[0] ? partWidths[0] : 0;
        var rightPartWidth = partWidths[1] ? partWidths[1] : 0;
        colDataType[colIndex]['dataLeftPartMaxWidth'] = Math.max(colDataType[colIndex].dataLeftPartMaxWidth, leftPartWidth);
        colDataType[colIndex]['dataRightPartMaxWidth'] = Math.max(colDataType[colIndex].dataRightPartMaxWidth, rightPartWidth);
        currCell.setAttribute('data-number-width', leftPartWidth);
        currCell.setAttribute('data-fraction-width', rightPartWidth);
        // even though its data column, their actual widths has to be considered for min and max widths
        // when calculating the alignment then we will be using the max left part width and right part width
        minWidth = maxWidth = leftPartWidth + rightPartWidth;
    }
    currCell.setAttribute('data-max-width', maxWidth);
    currCell.setAttribute('data-min-width', minWidth);
    // if the cell has colspan then it would mean that the max width is split across the spanned cells
    // min width however will remain the same
    for (var ci = colIndex; ci < (colIndex + colSpan); ci++) {
        colDataType[ci]['minWidth'] = Math.max(colDataType[colIndex].minWidth, minWidth / colSpan);
        colDataType[ci]['maxWidth'] = Math.max(colDataType[colIndex].maxWidth, maxWidth / colSpan);
    }

    // if we are inside tbody and
    // if we have information about this column from previous iteration
    // try to adjust the datatype base on previous data
    if ((headOrBody === 'tbody') && (typeof (colDataType[colIndex]) != 'undefined')) {
        if (colDataType[colIndex]['data-type'] === 'text') {
            dataType = 'text';
            dataPartsArr = [];
        } else if ((colDataType[colIndex]['data-type'] === 'data') && (colDataType[colIndex]['data-sub-type'] != subType)) {
            dataType = 'text';
            dataPartsArr = [];
        }
    }
    // if the cell is in thead then reset as we do not want this to influence the 'data' type column checks
    if (headOrBody === 'thead') {
        colDataType[colIndex]['data-type'] = '';
        colDataType[colIndex]['data-sub-type'] = '';
    } else {
        colDataType[colIndex]['data-type'] = dataType;
        colDataType[colIndex]['data-sub-type'] = subType;
    }
}

/**
 * check if the given input passes the quality requirements before taking it for processing
 * 1) input cannot have @style/@font/@width, etc attributes
 * 2) cells - th/td - cannot have direct text nodes, should be wrapped in <p> or similar nodes
 * 3) cells cannot have space at start and end
 * 4) cells cannot have just <br/> as its content or should not have <br/> at the end
 */
function checkInputQuality() {
    return new Promise(function (resolve, reject) {
        $('.jrnlPatterns').contents().unwrap();
        $('table').removeAttr('class')
            .addClass('nowrap')
            .removeAttr('width')
            .removeAttr('style')
            .removeAttr('data-table-type')
            .find('tr, td, th, p, ul, ol, li, bold, b, strong, itali, em, span')
            .removeAttr('style')
            .removeAttr('width')
            .removeAttr('align')
            .removeAttr('fontsize')
            .removeAttr('data-col-width')
            ;
        console.log('checkInputQuality');
        resolve(true);
    });
}

function checkIfTableValid(tbl, headOrBody) {
    return new Promise(function (resolve, reject) {
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
        cells.init = function (row, col, options) {
            cells[row + ':' + col] = $.extend({
                row: row,
                col: col,
                count: 0
            }, options);
        }
        cells.update = function (row, col, options) {
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
                        analyseData(currCell, col, headOrBody);
                    }
                }
                cells[row + ':' + col] = $.extend(cells[row + ':' + col], options);
            }
        }
        cells.get = function (row, col) {
            return cells[row + ':' + col];
        }

        var colspans = {};
        colspans.add = function (row, col, count) {
            for (var coladd = 0; coladd < count; coladd++) {
                colspans[row + ':' + (col + coladd)] = true;
            }
        };
        colspans.check = function (row, col) {
            return colspans[row + ':' + col];
        };

        var rowspans = {};
        rowspans.add = function (row, col, count) {
            for (var rowadd = 0; rowadd < count; rowadd++) {
                rowspans[(row + rowadd) + ':' + col] = true;
            }
        };
        rowspans.check = function (row, col) {
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

        /*
        if theads has colspan then we need to adjust the max width in the following rows
        for example if Row 1, Col 2 & 3 is spanned and the max width is 82px
        Row 2, Col 2 max width is 42px and Col 3 max width is 30px
        we would have split the max width between the columns and that would be 41 and 41 pixels
        this means that Col 3 would take about 11 pixels extra than required
        */
        if ((headOrBody == 'thead') && ($('thead').length > 0)) {
            var headRows = $('thead tr');
            headRows.each(function (rIndex, headRow) {
                var colSpanNodes = $(headRow).find('[colspan]');
                colSpanNodes.each(function (cIndex, colSpanNode) {
                    var rowIndex = parseInt(colSpanNode.getAttribute('data-row-index'));
                    var colSpan = parseInt(colSpanNode.getAttribute('colspan'));
                    var colIndex = parseInt(colSpanNode.getAttribute('data-col-index'));
                    var spannedCellMaxWidth = parseFloat(colSpanNode.getAttribute('data-max-width'));
                    var combinedMaxWidth = 0;
                    var endIndex = colSpan + colIndex;
                    for (i = colIndex; i < endIndex; i++) {
                        var childCells = $('thead [data-row-index="' + (rowIndex + 1) + '"][data-col-index="' + i + '"]');
                        childCells.each(function (ccIndex, childCell) {
                            console.log($(this).text(), $(this).attr('data-max-width'), colDataType[i].maxWidth);
                            combinedMaxWidth += parseFloat(childCell.getAttribute('data-max-width'));
                        })
                    }
                    console.log($(this).text(), spannedCellMaxWidth, combinedMaxWidth);
                    if (spannedCellMaxWidth > combinedMaxWidth) {
                        var percentage = spannedCellMaxWidth / combinedMaxWidth;
                        for (i = colIndex; i < endIndex; i++) {
                            var childCells = $('thead [data-row-index="' + (rowIndex + 1) + '"][data-col-index="' + i + '"]');
                            childCells.each(function (ccIndex, childCell) {
                                colDataType[i].maxWidth = parseFloat((parseFloat($(this).attr('data-max-width')) * percentage).toFixed(2));
                                console.log($(this).attr('data-max-width'), colDataType[i].maxWidth);
                            })
                        }
                    } else {

                    }
                });
            });
            console.log('span col width ajustment done');
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
    return new Promise(function (resolve, reject) {
        var tbl = document.getElementsByTagName('table');
        if (!tbl[0]) {
            reject('table not found');
            return false;
        }
        tbl = tbl[0];
        checkIfTableValid(tbl, 'thead')
            .then(function () {
                return checkIfTableValid(tbl, 'tbody');
            })
            .then(function () {
                resolve(true);
            })
            .catch(function (e) {
                reject(e);
            });
        console.log('validateTable');
    });
}

/**
 * using the information about the column widths determine what will be the final widths of the columns
 */
function determineFinalColWidths() {
    return new Promise(function (resolve, reject) {
        // step 0: determine the data and text columns
        // step 1: calculate the widths of all data columns, this is achieved by adding dataLeftPartMaxWidth and dataRightPartMaxWidth
        // step 2: calculate the remaining space after deducting the data columns space from the current layout, say single column width
        // step 3: calculate the min width required for the text columns by adding the min width values of all the text columns
        // step 4: calculate the max width required for the text columns by adding the max width values of all the text columns
        // step 5: apply the actual widths required for the data columns physically
        // step 6: if sum of min width of text columns is <= the available space, apply the proportionate width to the text columns
        //          if not skip this step
        // step 7: determine the area of the table - height x width
        // step 8: if sum of min width of text columns is > the available space, move to next available layout, say double column and
        //          apply the widths to text columns proportionately
        // step 9: repeat for the next available layout
        var tblWidth = 0;
        var colGroup = '<colgroup>';
        var lastCell = $('td:last');
        var paddingPerCol = parseInt(lastCell.css('padding-left')) + parseInt(lastCell.css('padding-right')) + parseInt(lastCell.css('border-left-width')) + parseInt(lastCell.css('border-right-width'));
        for (var colIndex in colDataType) {
            var currColData = colDataType[colIndex];
            var colType = currColData['data-type'];
            if (colType == 'data') {
                var dataColWidth = currColData['dataLeftPartMaxWidth'] + currColData['dataRightPartMaxWidth'];
                if (dataColWidth < currColData.minWidth) {
                    dataColWidth = currColData.minWidth;
                }
                colStats[colType].totalWidth += dataColWidth;
                colGroup += '<col id="col' + colIndex + '" width="' + (dataColWidth + paddingPerCol) + '"/>'
                tblWidth += dataColWidth + paddingPerCol;
                colStats[colType].colIndex.push(colIndex);
            }/*  else if (currColData.minWidth == currColData.maxWidth) {
                var dataColWidth = currColData.minWidth;
                colStats['data'].totalWidth += dataColWidth;
                colGroup += '<col id="col' + colIndex + '" width="' + (dataColWidth + paddingPerCol) + '"/>'
                tblWidth += dataColWidth + paddingPerCol;
                colStats['data'].colIndex.push(colIndex);
            } */
             else {
                colStats[colType].totalMinWidth += currColData.minWidth;
                colStats[colType].totalMaxWidth += currColData.maxWidth;
                colGroup += '<col id="col' + colIndex + '" width="' + (currColData.minWidth + paddingPerCol) + '"/>'
                tblWidth += currColData.minWidth + paddingPerCol;
                colStats[colType].colIndex.push(colIndex);
            }
        }
        var columnCount = parseInt(colIndex) + 1;
        var paddingSpace = paddingPerCol * columnCount;
        var prevLayoutFailed = false;
        console.log('table width ' + tblWidth);
        $('#tableContainer').css('overflow', 'auto').css('border', '1px solid');
        $('#tableContainer').css('width', tblWidth).css('min-width', tblWidth).css('max-width', tblWidth);
        $('table').css('table-layout', 'fixed').prepend(colGroup);
        // resolve(true);
        // return true;
        var columnCount = Object.keys(colDataType).length;
        // if the calculated table width is greater that possible widths then remove them from array to save iteration
        var shiftIndex = 0;
        $.each(layoutOptionsArr, function (index, currLayoutWidth) {
            if (currLayoutWidth < tblWidth) {
                shiftIndex++;
            }
            else{
                return false;
            }
        });
        if (shiftIndex > 0){
            layoutOptionsArr = layoutOptionsArr.splice(shiftIndex);
        }

        $.each(layoutOptionsArr, function (index, currLayoutWidth) {
            // make sure the body is wide enough to handle the table's width
            var maxTblWidth = Math.max(tblWidth, currLayoutWidth);
            $('#tableContainer').css('width', maxTblWidth).css('min-width', maxTblWidth).css('max-width', maxTblWidth);
            colStats['layout'][index] = {
                'width': currLayoutWidth,
                'colWidthArr': [],
                'tableHeight': 0,
                'fitsLayout': true
            }
            var availableSpace = currLayoutWidth - colStats.data.totalWidth - colStats.empty.totalWidth;
            // reduce the available space by space occupied by padding left and right
            availableSpace = availableSpace - ((colStats.data.colIndex.length + colStats.empty.colIndex.length) * paddingPerCol);
            // actual space required by data columns
            maxSpaceReqByDataCol = colStats.data.totalWidth + colStats.empty.totalWidth + ((colStats.data.colIndex.length + colStats.empty.colIndex.length) * paddingPerCol);
            // maximum space required by text columns
            maxSpaceReqByTextCol = colStats.text.totalMaxWidth + (colStats.text.colIndex.length * paddingPerCol);
            // minimum space required by text columns
            minSpaceReqByTextCol = colStats.text.totalMinWidth + (colStats.text.colIndex.length * paddingPerCol);
            // if the text columns' total min width is greater than available space then try the next layout
            if (colStats.text.totalMinWidth > availableSpace) {
                colStats['layout'][index]['fitsLayout'] = false;
                // continue
                return true;
            } else if (maxSpaceReqByTextCol <= availableSpace) {
                // if sum of max width of text columns is <= the available space
                // after utilizing the max width required if there is space available then
                // distribute that space proportionately between all available columns (text, data)
                var requiredSpace = maxSpaceReqByTextCol + maxSpaceReqByDataCol;

                //  before we go, distribute excess space, see if 'data' columns could potentially use that space
                var dataColsArr = colStats.data.colIndex;
                var excessSpace = currLayoutWidth - requiredSpace;
                var dataColAddWidth = {};
                /* dataColsArr.forEach(function(dataColIndex) {
                    var currColData = colDataType[dataColIndex];
                    var dataColWidth = currColData['dataLeftPartMaxWidth'] + currColData['dataRightPartMaxWidth'];
                    if (dataColWidth < currColData.minWidth) {
                        dataColWidth = currColData.minWidth;
                    }
                    var diffWidth = currColData.maxWidth - dataColWidth;
                    if ((excessSpace > 0) && (diffWidth > 0)) {
                        dataColAddWidth[dataColIndex] = diffWidth;
                        excessSpace -= diffWidth;
                        requiredSpace += diffWidth;
                    } else {
                        dataColAddWidth[dataColIndex] = 0;
                    }
                }); */

                var percentage = currLayoutWidth / requiredSpace;
                // the remaining space that needs to be proportionately distributed should not affect the last column
                // the expectation is that the last column should end at the right most possible point
                // if you include that column, then it would take some extra space and thats not desired
                var columnCount = Object.keys(colDataType).length;
                /* if (columnCount > 1) {
                    var lastColumnIndex = columnCount - 1;
                    var currColData = colDataType[lastColumnIndex];
                    var colType = currColData['data-type'];
                    var dataColWidth = currColData.maxWidth;
                    if (colType == 'data') {
                        dataColWidth = currColData['dataLeftPartMaxWidth'] + currColData['dataRightPartMaxWidth'];
                        if (dataColWidth < currColData.minWidth) {
                            dataColWidth = currColData.minWidth;
                        }
                        if (dataColAddWidth[lastColumnIndex]) {
                            dataColWidth += dataColAddWidth[lastColumnIndex];
                        }
                    } else if (currColData.minWidth == currColData.maxWidth) {
                        dataColWidth = currColData.minWidth;
                        if (dataColAddWidth[lastColumnIndex]) {
                            dataColWidth += dataColAddWidth[lastColumnIndex];
                        }
                    }
                    currLayoutWidth = currLayoutWidth - dataColWidth - (dataColAddWidth[lastColumnIndex] ? dataColAddWidth[lastColumnIndex] : 0);
                    var percentage = currLayoutWidth / (requiredSpace - dataColWidth - (dataColAddWidth[lastColumnIndex] ? dataColAddWidth[lastColumnIndex] : 0));
                } */

                percentage = 1;
                for (var colIndex in colDataType) {
                    // current column is the last column then we do not
                    if (columnCount == 1) {
                        percentage = 1;
                    }
                    columnCount--;
                    var currColData = colDataType[colIndex];
                    var colType = currColData['data-type'];
                    var dataColWidth = currColData.maxWidth;
                    if (colType == 'data') {
                        dataColWidth = currColData['dataLeftPartMaxWidth'] + currColData['dataRightPartMaxWidth'];
                        if (dataColWidth < currColData.minWidth) {
                            dataColWidth = currColData.minWidth;
                        }
                        if (dataColAddWidth[colIndex]) {
                            dataColWidth += dataColAddWidth[colIndex];
                        }
                    } else if (currColData.minWidth == currColData.maxWidth) {
                        dataColWidth = currColData.minWidth;
                        if (dataColAddWidth[colIndex]) {
                            dataColWidth += dataColAddWidth[colIndex];
                        }
                    }
                    var colWid = parseFloat(((dataColWidth + paddingPerCol) * percentage).toFixed(2));
                    $('#col' + colIndex).attr('width', colWid);
                    colStats['layout'][index]['colWidthArr'].push(colWid);
                }
            } else if (minSpaceReqByTextCol <= availableSpace) {
                var percentage = availableSpace / minSpaceReqByTextCol;
                for (var colIndex in colDataType) {
                    var currColData = colDataType[colIndex];
                    var colWid = 0;
                    if ((currColData['data-type'] == 'text') && (currColData.minWidth != currColData.maxWidth)) {
                        colWid = (currColData.minWidth + paddingPerCol) * percentage;
                    } else {
                        colWid = currColData.minWidth + paddingPerCol;
                    }
                    $('#col' + colIndex).attr('width', parseFloat((colWid).toFixed(2)));
                    colStats['layout'][index]['colWidthArr'].push(colWid);
                }
            }
            colStats['layout'][index]['tableHeight'] = $('table').height();
            $('#tableContainer').css('width', currLayoutWidth).css('min-width', currLayoutWidth).css('max-width', currLayoutWidth);
            if ((typeof (colStats['layout'][index - 1]) != 'undefined') && (colStats['layout'][index - 1]['fitsLayout'])) {
                var diffHeight = Math.abs(colStats['layout'][index]['tableHeight'] - colStats['layout'][index - 1]['tableHeight']);
                var maxHeight = Math.max(colStats['layout'][index]['tableHeight'], colStats['layout'][index - 1]['tableHeight']);
                var minHeight = Math.max(colStats['layout'][index]['tableHeight'], colStats['layout'][index - 1]['tableHeight']);
                // Condition A: the current typeset height should be atleast 2/3 less that the previous typeset height
                // if not having in the current layout is not effective, revert to previous layout and stop
                // Condition B: if the height of table from previous layout and current layout has not changed
                if ((colStats['layout'][index]['tableHeight'] == colStats['layout'][index - 1]['tableHeight']) || (minHeight > (maxHeight * 2 / 3))) {
                    var colWidthArr = colStats.layout[index - 1].colWidthArr;
                    colWidthArr.forEach(function (currColWidth, cIndex) {
                        $('#col' + cIndex).attr('width', currColWidth);
                    });
                    var currLayoutWidth = layoutOptionsArr[index - 1];
                    $('#tableContainer').css('width', currLayoutWidth).css('min-width', currLayoutWidth).css('max-width', currLayoutWidth);
                    return false;
                } else {
                    return false;
                }
                return false;
            }
        });
        resolve(true);
    });
}

/**
 *
 */
function typesetTable() {
    console.log('window loaded');
    $('body').append('<table id="dummy"/>');
    $('#dummy').attr('data-table-type', 'singleColumn');
    layoutOptionsArr.push($('#dummy').outerWidth());
    $('#dummy').attr('data-table-type', 'doubleColumn');
    layoutOptionsArr.push($('#dummy').outerWidth());
    $('#dummy').attr('data-table-type', 'landScape');
    layoutOptionsArr.push($('#dummy').outerWidth());
    $('#dummy').remove();
    rangy.init();
    checkInputQuality().then(function (data) {
        return validateTable();
    })
        .then(function (d) {
            $("table").removeAttr('border').removeClass('nowrap').css("white-space", "");
            $('style').remove();
            determineFinalColWidths();
            console.log('done');
        })
        .catch(function (e) {
            console.log('error', e);
        });

}
/**
 * start the process when the window has loaded
 */
(function () {
    $(window).on('load', function () {
        if ($('table').length > 0) {
            typesetTable();
        }
    });
})();