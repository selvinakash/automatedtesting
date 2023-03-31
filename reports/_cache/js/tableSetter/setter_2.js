/** global variable */
var colDataType = {}; // store info about a particular column and its data types
var range = '';
var singleColumn = 0; //243.138; // mentioned singlecolumn width value
var doubleColumn = 0; //509.276; // mentioned doublecolumn width value
var landScapeColumn = 0; //671.361; //// mentioned landscapecolumn width value
var groupByColType = {
    'data': [],
    'text': [],
    'empty': [],
    'borrowWidth': [],
    'provideWidth': []
};
//https://regex101.com/r/QqIUEI/2
var spacePtn = "\u0020\u00A0";
var hyphenPtn = "\\-\u2013\u2212\u2014";
var dataRegEx = new RegExp('^([' + spacePtn + ']*[' + hyphenPtn + ']?[0-9]+)([0-9\.]*[' + spacePtn + ']*)((to|\\(|\\+|[' + hyphenPtn + ']|\u00B1)?[' + spacePtn + ']*[' + hyphenPtn + ']?[0-9]+[0-9\\.' + spacePtn + hyphenPtn + '\\)\u00B1]*)?$', 'gi');
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
 * get more information about the cell
 * @param {DOMElement} currCell
 * @param {Integer} colIndex
 */
function analyseData(currCell, colIndex, headOrBody) {
    if (typeof(colDataType[colIndex]) == 'undefined') {
        colDataType[colIndex] = {
            'minWidth': 0,
            'maxWidth': 0,
            'dnumberMaxWidth': 0,
            'dfractionMaxWidth': 0,
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

    var cellText = $('<div/>').html($(currCell).html().replace(/<br[^>]*>/, ' ')).text();
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
            }
            dataPartsArr = [leftPart, rightPart];
        }
    }
    var colSpan = currCell.colSpan ? currCell.colSpan : 1;
    var maxWidth = 0;
    var minWidth = 0;
    var numberMaxWidth = 0;
    // max. width of the column will be the inner width of the cell
    // min. width of the column will be the width of longest (unbroken) word for a text type column,
    //    the width of the entire content if data type column
    if ((dataType === 'text') || (dataType === 'empty')) {
        // TODO: add checks for cases where data is empty
        var sel = rangy.getSelection();
        // assuming there is a <p> tag, get the width of its contents, else get the width of the cell
        if ((currCell.childElementCount == 1) && (currCell.firstElementChild.localName == 'p')) {
            sel.selectAllChildren(currCell.firstElementChild);
        } else {
            sel.selectAllChildren(currCell);
        }
        maxWidth = trimText == "" ? 0 : getSelectionWidth();
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
        colDataType[colIndex]['dnumberMaxWidth'] = Math.max(colDataType[colIndex].dnumberMaxWidth, leftPartWidth);
        colDataType[colIndex]['dfractionMaxWidth'] = Math.max(colDataType[colIndex].dfractionMaxWidth, rightPartWidth);
        currCell.setAttribute('data-number-width', leftPartWidth);
        currCell.setAttribute('data-fraction-width', rightPartWidth);
        // even though its data column, their actual widths has to be considered for min and max widths
        // when calculating the alignment then we will be using the max left part width and right part width
        minWidth = maxWidth = leftPartWidth + rightPartWidth;
    }
    currCell.setAttribute('data-max-width', maxWidth);
    currCell.setAttribute('data-min-width', minWidth);
    colDataType[colIndex]['minWidth'] = Math.max(colDataType[colIndex].minWidth, minWidth);
    colDataType[colIndex]['maxWidth'] = Math.max(colDataType[colIndex].maxWidth, maxWidth);
    // if we are inside tbody and
    // if we have information about this column from previous iteration
    // try to adjust the datatype base on previous data
    if ((headOrBody === 'tbody') && (typeof(colDataType[colIndex]) != 'undefined')) {
        if (colDataType[colIndex]['data-type'] === 'text') {
            dataType = 'text';
            dataPartsArr = [];
        } else if ((colDataType[colIndex]['data-type'] === 'data') && (colDataType[colIndex]['data-sub-type'] != subType)) {
            dataType = 'text';
            dataPartsArr = [];
        }
    }
    colDataType[colIndex]['data-type'] = dataType;
    colDataType[colIndex]['data-sub-type'] = subType;
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
                        analyseData(currCell, col, headOrBody);
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
 * using the information about the column widths determine what will be the final widths of the columns
 */
function determineFinalColWidths() {
    //step 1: calculate the widths of all data columns, this is achieved by adding the

}
/*
 * function to calculate the width of all the columns and decide on which pattern to follow and
 * set appropriate width for each column
 * after all the values set in the colDataType the following function is called to make the
 * alignments accordingly after the calculation
 */
function calculateColumnWidths1() {
    var dataWidth = 0;
    var textWidth = 0;
    var textMaxWidth = 0;
    var textMinWidth = 0;
    var totalColumnsCount = 0;
    var proportionBy = 0;
    var totalNeedWidth = 0;
    var excessWidth = 0;
    dataColumns = groupByColType.data;
    textColumns = groupByColType.text;
    emptyColumns = groupByColType.empty;
    for (var key in dataColumns) {
        colIndex = dataColumns[key];
        colDataType[colIndex].width = colDataType[colIndex].dnumberMaxWidth + colDataType[colIndex].dfractionMaxWidth;
        dataWidth += colDataType[colIndex].width;
    }


    for (var key in textColumns) {
        colIndex = textColumns[key];
        //colDataType[colIndex].width=colDataType[colIndex].minWidth!=0?colDataType[colIndex].minWidth:colDataType[colIndex].maxWidth;
        textMaxWidth += colDataType[colIndex].maxWidth;
        textMinWidth += colDataType[colIndex].minWidth;
        /*if(colDataType[colIndex].maxWidth-colDataType[colIndex].width>0){
			colDataType[colIndex].widthWrapped=colDataType[colIndex].maxWidth-colDataType[colIndex].width;
            colDataType[colIndex].borrowWidth=true;
            if(groupByColType.borrowWidth.indexOf(colIndex)<0){
            	groupByColType.borrowWidth.push(colIndex);
            }
            proportionBy+=1;
            totalNeedWidth+=colDataType[colIndex].widthWrapped;
    	}*/
    }


    var totalWidth = dataWidth + textMinWidth;



    var extraPixel = 0;
    var extraPixelByColumn = 0;
    var selectedColumnType = 0;
    var distributeValue = 1;


    /*singleColumn=singleColumn-(12*(dataColumns.length+textColumns.length+emptyColumns.length));
    doubleColumn=doubleColumn-(12*(dataColumns.length+textColumns.length+emptyColumns.length));
    landScapeColumn=landScapeColumn-(12*(dataColumns.length+textColumns.length+emptyColumns.length));*/

    // process of selecting the column type
    if (totalWidth <= singleColumn) {
        selectedColumnType = singleColumn;
    } else if (totalWidth > singleColumn && totalWidth <= doubleColumn) {
        selectedColumnType = doubleColumn;
    } else {
        selectedColumnType = landScapeColumn;
    }
    distributeAndFindColumnType(selectedColumnType, dataWidth, textMaxWidth, textColumns);

    var fromKey = -1;
    var toKey = -1;
    for (var key in colDataType) {
        /*if(extraPixelByColumn>0){
            colDataType[key].width+=extraPixelByColumn;
        }*/
        // code for col-span headers
        /*if(colDataType[key].headerColSpan>1){
            colSplitBy=colDataType[key].headerColSpan;//2
            fromKey=parseInt(key);//0
            toKey=parseInt(key)+colSplitBy-1;//0+2-1=1
        }*/
        var columnIndex = parseInt(key) + 1;
        $(".MsoTableGrid tr").each(function() {
            //console.log(" number attribute " + $(this).find("td:nth-child(" + columnIndex + ")").attr('data-number-width') + " fraction attribute " + $(this).find("td:nth-child(" + columnIndex + ")").attr('data-fraction-width'));
            //console.log("p tag value " + $(this).find("td:nth-child(" + columnIndex + ")"));
            var columnList = $(this).find("td:nth-child(" + columnIndex + ")");
            //alert($(this).find("tr:nth-child("+key+") td").length);
            if (colDataType[key]['data-type'] == 'text') {
                columnList.css('width', colDataType[key].width + 'px');
            } else {
                columnList.css('width', colDataType[key].width + 'px');
            }

            for (i = 0; i <= columnList.length - 1; i++) {
                //console.log(columnList[i].getAttribute('data-number-width') + " " + columnList[i].getAttribute('data-fraction-width'));
                // code for col-span header implementation its with bug
                /*if(columnList[i].getAttribute('colSpan')==null && parseInt(key)>=fromKey && parseInt(key)<=toKey
                    && parseInt(columnList[i].getAttribute('data-row-index'))!=0){

                    columnList[i].width=0;
                    columnList[i].height=0;
                    columnList[i].style.width=colDataType[fromKey].width/colSplitBy+'px';
                }else{
                    //columnList[i].css('width',colDataType[key].width+'px');
                    columnList[i].style.width=colDataType[key].width+'px';
                }*/
                numberWidth = columnList[i].getAttribute('data-number-width') == null ? colDataType[key].dnumberMaxWidth : columnList[i].getAttribute('data-number-width');
                fractionWidth = columnList[i].getAttribute('data-fraction-width');
                pTagData = columnList[i].getElementsByTagName('p');
                if (pTagData.length > 0) {
                    if (colDataType[key]['data-type'] == 'data') {
                        /*colDataType[key].dnumberMaxWidth==*/
                        /*if((colDataType[key].dnumberMaxWidth-Number(numberWidth))>1){*/
                        pTagData[0].style.paddingLeft = (Math.floor(colDataType[key].dnumberMaxWidth - Number(numberWidth))) + "px";

                        /*}*/
                        // pTagData[0].style.paddingRight=(colDataType[key].dfractionMaxWidth-Number(fractionWidth))+"px";
                        //pTagData[0].style.paddingLeft
                    } else {
                        // pTagData[0].align="left";
                    }
                }
            }

        });
    }


}



function distributeAndFindColumnType(columnType, dataWidth, textWidth, textColumns) {

    var remainWidth = columnType - dataWidth;
    var distributePer = remainWidth / textWidth;
    var excessWidth = 0;
    var variantWidth = 0;
    for (var key in textColumns) {
        colIndex = textColumns[key];
        setWidth = colDataType[colIndex].maxWidth * distributePer;
        if (setWidth > colDataType[colIndex].minWidth) {
            excessWidth += setWidth - colDataType[colIndex].minWidth;
            if (groupByColType.provideWidth.indexOf(colIndex) < 0) {
                groupByColType.provideWidth.push(colIndex);
            }
            colDataType[colIndex].width = setWidth;
        } else {
            if (groupByColType.borrowWidth.indexOf(colIndex) < 0) {
                groupByColType.borrowWidth.push(colIndex);
                //variantWidth+=colDataType[groupByColType.borrowWidth[key]].maxWidth;
            }
            colDataType[colIndex].width = setWidth;
        }

        /*if(groupByColType.borrowWidth)*/
    }

    if (excessWidth > 0 && groupByColType.borrowWidth.length > 0 && groupByColType.provideWidth.length > 0) {
        var borrowColumns = groupByColType.borrowWidth;
        var provideColumns = groupByColType.provideWidth;
        for (var borrowKey in borrowColumns) {
            borrowColIndex = borrowColumns[borrowKey];
            var widthNeeded = colDataType[borrowColIndex].minWidth - colDataType[borrowColIndex].width;
            var widthToProvide = 0;
            for (var provideKey in provideColumns) {
                provideColIndex = provideColumns[provideKey];
                var currentProvider = colDataType[provideColIndex].width - colDataType[provideColIndex].minWidth;
                widthToProvide += currentProvider;
                if (widthToProvide >= widthNeeded) {
                    colDataType[borrowColIndex].width = colDataType[borrowColIndex].width + widthNeeded;
                    colDataType[provideColIndex].width = (colDataType[provideColIndex].width - currentProvider) + (widthToProvide - widthNeeded);
                    break;
                }
                colDataType[provideColIndex].width = colDataType[provideColIndex].width - currentProvider;
            }
        }
    }
    //console.log(excessWidth);

}

/*
* function to select the column type by using the 1.totalwidth of data,2. proportionBy for the datas in need of width,
3. current columntype (eg:singlecolumnwidth) according to the totalwidth, 4. next higher level suggested columnType (eg:doublecolumnwidth)
*/
function selectColumnType(totalWidth, proportionBy, columnType, suggestionColumnType) {
    columnCheck = (columnType - totalWidth) / proportionBy;
    suggestionColumnCheck = (suggestionColumnType - totalWidth) / proportionBy;

    for (var columnData in colDataType) {
        if (colDataType[columnData].borrowWidth) {
            columnLines = colDataType[columnData].maxWidth / (colDataType[columnData].width + columnCheck);
            suggestionColumnLines = colDataType[columnData].maxWidth / (colDataType[columnData].width + suggestionColumnCheck);
            console.log("column-type :" + columnLines);
            console.log("suggestionColumnLines :" + suggestionColumnLines);
            // if(((columnLines-suggestionColumnLines)/suggestionColumnLines*100)>50){
            if (columnLines - suggestionColumnLines > 4) {
                console.log("selected column width " + suggestionColumnType);
                return suggestionColumnType;
                break;
            }
            console.log("selected column width " + columnType);
            return columnType;
        }
    }
}

/**
 * start the process when the window has loaded
 */
(function() {
    $(window).on('load', function() {
        console.log('window loaded');
        $('body').append('<table id="dummy"/>');
        $('#dummy').attr('data-table-type', 'singleColumn');
        singleColumn = $('#dummy').outerWidth();
        $('#dummy').attr('data-table-type', 'doubleColumn');
        doubleColumn = $('#dummy').outerWidth();
        $('#dummy').attr('data-table-type', 'landScape');
        landScapeColumn = $('#dummy').outerWidth();
        $('#dummy').remove();
        rangy.init();
        checkInputQuality().then(function(data) {
                return validateTable();
            })
            .then(function(d) {
                calculateColumnWidths();
                $("table").css("white-space", "normal");
                console.log('done');
            })
            .catch(function(e) {
                console.log('error', e);
            })
    });
})();