/** global variable */
var colDataType = {}; // store info about a particular column and its data types
var mixedColDataType ={};
var range = '';
var layoutOptionsArr = []; // will store the available widths in which the table can be typeset
var layoutOptionsNamesArr = ['singleColumn', 'doubleColumn','threeColumn', 'landScape', 'spreadColumn'];
var fixIt = false;
var fixInToIt = false;
var skipFixSpace = false
var colStats = {
    'data': {
        'colIndex': [],
        'totalMinWidth': 0,
        'totalMaxWidth': 0
    },
    'text': {
        'colIndex': [],
        'totalMinWidth': 0,
        'totalMaxWidth': 0
    },
    'empty': {
        'colIndex': [],
        'totalMinWidth': 0,
        'totalMaxWidth': 0
    },
    'mixed-data':{
        'colIndex': [],
        'totalMinWidth': 0,
        'totalMaxWidth': 0
    },
    'mixed-data-subtype' : [],
    'dataTypeIndex':{},
    'layout': {}
}
var layoutInfo = {
    'colCount': 0,
    'colTypeIndex': {
        'text': [],
        'data': [],
        'empty': []
    },
    'colWidthArr': [],
    'dataObj': {},
    'mixed-dataObj': {},
    'tableWidth': 0,
    'tableWidthName': '',
    'align':{
        'valign':[],
        'text':{}
    },
    'reducedColIndex':[],
    'indent':{},
    'centreAlignCol':[]
}
// variables: config, customer and project are imported from tablesetterprepateHTMLFile
// if leftAlignFirstColumn is set to true( if config set for this customer), then first column will be column of data type text( which is left aligned by default)
var leftAlignFirstColumn = config.tablesetter.additionalRules.leftAlignFirstColumn.indexOf(customer) >= 0 ? true : false;
// if centerCharAlign is set; then the data alignment will be done based on column specific character and data will be aligned along center rather than left.
var centerCharAlign = config.tablesetter.additionalRules.centerCharAlign.indexOf(customer) >= 0 ? true : false;
// centerAlignMixedData is set; then mixed data should be centre aligned
var centerAlignMixedData = config.tablesetter.additionalRules.centerAlignMixedData.indexOf(customer) >= 0 ? true : false;
var skipDistributeExtraSpace = config.tablesetter.additionalRules.skipDistributeExtraSpace.indexOf(customer) >= 0 ? true : false;
var centerAlignTblHead = config.tablesetter.additionalRules.centerAlignTblHead.indexOf(customer) >= 0 ? true : false;
var centerAlignTblBody = config.tablesetter.additionalRules.centerAlignTblBody.indexOf(customer) >= 0 ? true : false;
var alignmentOrder = [];
var custProj = customer+'_'+project
if(config.alignmentOrder && config.alignmentOrder[customer]){
    alignmentOrder = config.alignmentOrder[customer]
}
else if(config.alignmentOrder && config.alignmentOrder[custProj]){
    alignmentOrder = config.alignmentOrder[custProj]
}
var alignType = $('table').find('tr[currentselection="true"], td[currentselection="true"], th[currentselection="true"]').attr('align-type')?$('table').find('tr[currentselection="true"], td[currentselection="true"], th[currentselection="true"]').attr('align-type'):''
if(alignType=='left'){
    centerCharAlign = false
    centerAlignMixedData = false
}
else if(alignType=='center'){
    centerCharAlign = true
    centerAlignMixedData = true
}
// Variable to check thead and tbody have equal no of columns and empty columns
var theadColCount = 0;
var theadRowCount = 0;
var theadEmptyCols;
var tbodyEmptyCols;

// https://regex101.com/r/QqIUEI/2
// https://regex101.com/r/QqIUEI/4
var spacePtn = "\u0020\u00A0\u2009\r\n\t";  // thin space added: MMH - 25.1.19
var hyphenPtn = "\\-\u2013\u2212\u2014";
var dataPattern = "\<\>\u2264\u2265\=\(";   // introduced less than equal and greater than equal
var currencyPtn = "\u0024\u20AC\u00A3";
var fnoteCitationPtn = "[\\*\u2020\u2021\u00A7\u00B6abcdefg][\\,\\-\\s]*";    // regex to capture fnote citation after the data (e.g: 1* | 1a | 1a b | 1ab | 1*,† | 1a-c | 1a, c )
// var dataRegEx = new RegExp('^([' + spacePtn + hyphenPtn + '\<]*[0-9]*)([\\.0-9]*[' + spacePtn + ']*)((to|\\(|\\+|[' + hyphenPtn + ']|\u00B1)?[0-9\\.\\,\\)' + spacePtn + hyphenPtn + ']+)?$', 'i');
var dataRegEx = new RegExp(`^([${spacePtn}]*[${dataPattern}]{0,2}[\+${hyphenPtn}]?(?:[\\,\u2009\u0020]?[0-9]+)+|[${spacePtn}]*[${dataPattern}]{0,2}[${hyphenPtn}]?(?:[\\,\u2009\u0020]?)+)([0-9\\.\\×\\%${currencyPtn}a-z\*\u2020\u03EF]*[${spacePtn}]*)((to|\\(|\\+|[${hyphenPtn}]|\u2014|\u00B1|\\[)?([${spacePtn}]*[${hyphenPtn}]?[0-9\\,\\.\\;\\-\\+\\×\\>\\<\\=a-z]*[0-9\\.\u0020\u2009\u2013\u2010\\-\)\\]\u00B1(?:to)\\%\\,\[\\/${currencyPtn}a-z]*))?((?:${fnoteCitationPtn}){0,5})?$`,'i');

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
                //console.log('cannot find currWord: ', currWord);
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
function longestWord(str,forceFitFlag) {
    var longestWordArr = str.split(/\s|\/|\\/).sort(function (a, b) { return b.length - a.length; });
    if(forceFitFlag){
        longestWordArr = str.split(/\s|\/|\\|\_|\-|\.|\:|\;|\+|\,|\&|\@|\?/).sort(function (a, b) { return b.length - a.length; });
    }
    var wholeArr = [];
    var tlength = 0;
    for (var i = 0; i < longestWordArr.length; i++) {
        if (tlength < longestWordArr[i].length) {
            tlength = longestWordArr[i].length;
        }
    }
    for (var j = 0; j < longestWordArr.length; j++) {
        if (longestWordArr[j].length == tlength) {
            wholeArr.push((matchedSpace?matchedSpace[0]:"") + longestWordArr[j]);   // matchedSpace added to handle hanging indentation
        }
    }
    return wholeArr;
}

/**
 * get more information about the cell
 * @param {DOMElement} currCell
 * @param {Integer} colIndex
 */
function analyseData(currCell, colIndex, headOrBody, rowIndex) {
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
                'headerColSpan': 0,
                'maxCellHeight' : 0,
                'minLastLineWidth' : 0
            };
            layoutInfo['dataObj'][ci] = {};
            layoutInfo['mixed-dataObj'][ci] = {};
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
    var alignName = $(currCell).attr('data-align')?$(currCell).attr('data-align'):''
    var textAlignFlag = $(currCell).attr('align')?$(currCell).attr('align'):'false';
    var textCount = (trimText.match(/[a-z]/gi) || []).length;
    // if the entire cell is empty or has only space in it
    if (/^[\s\u00A0]*$/gi.test(trimText)) {
        dataType = 'empty';
    }
    // if only hyphen found in the cell. skip type indentification process so as to check with other cell in this column to determine column type
    else if(trimText.match(`^[${spacePtn}]*[${hyphenPtn}][${spacePtn}]*$`)){
        // if col type not set, set it as ''
        if(!colDataType[colIndex]['data-type']){
            colDataType[colIndex]['data-type'] = '';
            colDataType[colIndex]['data-sub-type'] = '';
        }
        return;
    }
    // based on config, if first column should be left aligned, set dataType of col type as text
    else if(colIndex == 0 && leftAlignFirstColumn == true && alignName==''){
        dataType = 'text';
    }
    else if(textCount > 10 && alignName==''){
        dataType = 'text';
    }
    else if((/^[a-z]/i).test(trimText) || (colIndex == 0  && !(/[0-9]/g).test(trimText))){//trimtext not contains numerals, it is text
        dataType = 'text';
    }
    else if(textAlignFlag && textAlignFlag!="false"){//when user has set text align, retain text align on change layout
        dataType = 'text';
    }
    else if($(currCell).parents('thead').length>0){
        dataType = 'text';
    }
    else {
        dataPartsArr = dataRegEx.exec(trimText);
        // if dataPartsArr is null, it means that the given cell is not of type 'data', mark it as 'text' cell
        if (dataPartsArr === null) {
            dataType = 'text';
        } else {
            var tempDataRegex = new RegExp('^([0-9\\.]+\\ ?)(.*)(to|\\±|\\:|\\%|\\–|\\-)(.*)')
            var tempDataPartsArr = tempDataRegex.exec(trimText);
            if (tempDataPartsArr === null) {
                tempDataRegex =new RegExp("^([0-9\\.]+\ ?)(.*)?(\\()(.*)");
                tempDataPartsArr = tempDataRegex.exec(trimText);
            }
            if(tempDataPartsArr!=null){
                var tempLeftPart = tempDataPartsArr[1] + (tempDataPartsArr[2] ? tempDataPartsArr[2] : "") +(tempDataPartsArr[3] ? tempDataPartsArr[3] : "");
                var tempRightPart = (tempDataPartsArr[4] ? tempDataPartsArr[4] : "");
                tempDataPartsArr =[tempLeftPart,tempRightPart]
            }
            else{
                tempDataPartsArr=[trimText]
            }
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
            
            if (alignName!=''&& /[\u00B1\xB1\+\u2013\u2014\-\u2212]/.test(alignName) && alignName.test(dataPartsArr[4])||alignName==''&& /[\u00B1\xB1\+\u2013\u2014\-\u2212]/.test(dataPartsArr[4])) {
                // anything before the above character is the left part and from that character till end is the right part
                var leftPart = dataPartsArr[1] + (dataPartsArr[2] ? dataPartsArr[2] : "");
                // handle column width change if has fnote citations. 6th group also considered to calculate column width.
                var rightPart = (dataPartsArr[3] ? dataPartsArr[3] : "") + (dataPartsArr[6] ? dataPartsArr[6] : "");
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
            }
            else if((alignName=='') &&/\./.test(dataPartsArr[2]) && (/\(/.test(dataPartsArr[4])||/\[/.test(dataPartsArr[4]))){
                var alignPrecedence ='brace';
                if(alignmentOrder && alignmentOrder.length>0){
                    alignPrecedence=alignmentOrder[0];
                }
                if(alignPrecedence == 'brace'){
                    var leftPart = dataPartsArr[1] + (dataPartsArr[2] ? dataPartsArr[2] : "");
                    // handle column width change if has fnote citations. 6th group also considered to calculate column width.
                    var rightPart = (dataPartsArr[3] ? dataPartsArr[3] : "") + (dataPartsArr[6] ? dataPartsArr[6] : "");
                    subType = 'decimal';
                }
                else{
                    var leftPart = (dataPartsArr[1] ? dataPartsArr[1] : "");
                    // handle column width change if has fnote citations. 6th group also considered to calculate column width.
                    var rightPart = dataPartsArr[2] + (dataPartsArr[3] ? dataPartsArr[3] : "") + (dataPartsArr[6] ? dataPartsArr[6] : "");
                    subType = 'decimal';
                }
            }
            else if((alignName=='parenthesis') &&/\./.test(dataPartsArr[2]) && (/\(/.test(dataPartsArr[4])||/\[/.test(dataPartsArr[4]))){
                var leftPart = dataPartsArr[1] + (dataPartsArr[2] ? dataPartsArr[2] : "");
                // handle column width change if has fnote citations. 6th group also considered to calculate column width.
                var rightPart = (dataPartsArr[3] ? dataPartsArr[3] : "") + (dataPartsArr[6] ? dataPartsArr[6] : "");
                subType = 'parenthesis';
                
            }
            else if((alignName == '' || alignName=='parenthesis') && /\(/.test(dataPartsArr[4])|| alignName=='' && /\[/.test(dataPartsArr[4]) || /\(/.test(alignName) && /\(/.test(dataPartsArr[4]) || /\(/.test(alignName) && /\[/.test(dataPartsArr[4])){
                var leftPart = dataPartsArr[1] + (dataPartsArr[2] ? dataPartsArr[2] : "");
                // handle column width change if has fnote citations. 6th group also considered to calculate column width.
                var rightPart = (dataPartsArr[3] ? dataPartsArr[3] : "") + (dataPartsArr[6] ? dataPartsArr[6] : "");
                subType = 'decimal';
                if(alignName=='parenthesis'){
                    subType = 'parenthesis';
                } 
            }
            else if((alignName=='parenthesis' && /\(/.test(trimText)) || (alignName=='parenthesis' && /\[/.test(trimText))){
                // when user wants parenthesis and regexpattern does not match split the text using parenthesis.
                var dataPartsArr = trimText.split(/\(|\[/);
                var leftPart = dataPartsArr[0] ;
                var rightPart = '('+dataPartsArr[1];
                if(/\[/.test(trimText)){
                    rightPart = '['+dataPartsArr[1];
                }
                subType = 'parenthesis';
            }
            else if (alignName!=''&& /[\u00B1\xB1\+\u2013\u2014\-\u2212]/.test(dataPartsArr[4]) ) {
                var leftPart = dataPartsArr[1] + (dataPartsArr[2] ? dataPartsArr[2] : "");
                var rightPart = (dataPartsArr[3] ? dataPartsArr[3] : "") + (dataPartsArr[6] ? dataPartsArr[6] : "");
                 if(dataPartsArr[4].match(charHyphen)) {
                    subType = 'hyphen';
                 }
                 else if(dataPartsArr[4].match(charMDash)){
                    subType = 'mdash';
                 }
                 else if(dataPartsArr[4].match(charMinus)){
                    subType = 'minus';
                 }
                 else if(dataPartsArr[4].match(charNDash)){
                    subType = 'ndash';
                 }
                 else if(dataPartsArr[4].match(charPlusMn)){
                    subType = 'plusmn';
                 }
                 else{
                    subType = 'decimal';
                 }
                 if(alignName!=subType){
                     leftPart = (dataPartsArr[1] ? dataPartsArr[1] : "");
                     rightPart = dataPartsArr[2] + (dataPartsArr[3] ? dataPartsArr[3] : "") + (dataPartsArr[6] ? dataPartsArr[6] : "");
                     subType = 'decimal';
                 }          
            }
            else {
                // the integer part alone becomes the left part and the remaining the right part
                // this ensures that 10 and 0.5 on rows A and B align on `0`
                var leftPart = (dataPartsArr[1] ? dataPartsArr[1] : "");
                // handle column width change if has fnote citations. 6th group also considered to calculate column width.
                var rightPart = dataPartsArr[2] + (dataPartsArr[3] ? dataPartsArr[3] : "") + (dataPartsArr[6] ? dataPartsArr[6] : "");
                subType = 'decimal';
            }
            dataPartsArr = [leftPart, rightPart];
        }
    }
    var maxWidth = 0;
    var minWidth = 0;
    var forceFitMinwidth = 0;
    var numberMaxWidth = 0;
    // max. width of the column will be the inner width of the cell
    // min. width of the column will be the width of longest (unbroken) word for a text type column,
    //    the width of the entire content if data type column
    if ((dataType === 'text') || (dataType === 'empty') || (headOrBody === 'thead')) {
        // TODO: add checks for cases where data is empty
        // if the dataType is empty and the previous row current column is of type 'data' or 'text', change dataType
        if ((colDataType[colIndex]['data-type'] != 'empty') && (dataType === 'empty')) {
            dataType = colDataType[colIndex]['data-type'];
            subType = colDataType[colIndex]['data-sub-type'];
        }
        $(currCell).find('a').each(function () {
            var linkText = $(this).text();
            linkText = addLogicalBreaksToLinks(linkText);
            $(this).text(linkText);
        });
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
            matchedSpace = cellText.match(/^([\s\uFEFF\xA0])+/g);
            longestWordArr = longestWord(trimText);
            
            minWidth = getMinWidth(currCell, longestWordArr, false);
            var forceFitlongestWordArr = longestWord(trimText,true);
            forceFitMinwidth = getMinWidth(currCell, forceFitlongestWordArr, false);
            // if list order is added before list. consider its width for hanging indent
            if(currCell.querySelector('ol>li')){
                var listOrderPX = window.getComputedStyle(
                    currCell.querySelector('ol>li'), ':before'
                ).width;
                if(listOrderPX) minWidth += parseInt(listOrderPX);
            }
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
        layoutInfo['dataObj'][colIndex][rowIndex] = {
            'leftPartWidth': leftPartWidth,
            'rightPartWidth': rightPartWidth,
            "subType":subType
        }
        currCell.setAttribute('data-number-width', leftPartWidth);
        currCell.setAttribute('data-fraction-width', rightPartWidth);
        var tempPartWidths = getMinWidth(currCell, tempDataPartsArr, true);
        var tempLeftPartWidth = tempPartWidths[0] ? tempPartWidths[0] : 0;
        var tempRightPartWidth = tempPartWidths[1] ? tempPartWidths[1] : 0;
        colDataType[colIndex]['tempLeftPartMaxWidth'] = Math.max((colDataType[colIndex].tempLeftPartMaxWidth?colDataType[colIndex].tempLeftPartMaxWidth:0), tempLeftPartWidth);
        colDataType[colIndex]['tempRightPartMaxWidth'] = Math.max((colDataType[colIndex].tempRightPartMaxWidth?colDataType[colIndex].tempRightPartMaxWidth:0), tempRightPartWidth);
        currCell.setAttribute('data-temp-number-width', tempLeftPartWidth);
        currCell.setAttribute('data-temp-fraction-width', tempRightPartWidth);
        // even though its data column, their actual widths has to be considered for min and max widths
        // when calculating the alignment then we will be using the max left part width and right part width
        minWidth = maxWidth = leftPartWidth + rightPartWidth;
        //get the max leftpartwidth and max rightpart width
        if ((headOrBody === 'tbody') && (typeof (colDataType[colIndex]) != 'undefined')) {
            for (var cIndex = colIndex; cIndex < (colIndex + colSpan); cIndex++) {
                if(currCell.cellIndex == cIndex){
                    colDataType[cIndex]['tbody-maxLeftPart'] = Math.max(colDataType[cIndex]['tbody-maxLeftPart']?colDataType[colIndex]['tbody-maxLeftPart']:0, leftPartWidth );
                    colDataType[cIndex]['tbody-maxRightPart'] = Math.max(colDataType[cIndex]['tbody-maxRightPart']?colDataType[colIndex]['tbody-maxRightPart']:0, rightPartWidth );
                }
            }
        }
    }
    if ((headOrBody === 'thead') && (typeof (colDataType[colIndex]) != 'undefined')) {
        for (var cIndex = colIndex; cIndex < (colIndex + colSpan); cIndex++) {
            //if(currCell.cellIndex == cIndex){
                colDataType[cIndex]['thead-minwidth'] = Math.max(colDataType[cIndex]['thead-minwidth']?colDataType[colIndex]['thead-minwidth']:0, minWidth/ colSpan );
                colDataType[cIndex]['thead-maxwidth'] = Math.max(colDataType[cIndex]['thead-maxwidth']?colDataType[colIndex]['thead-maxwidth']:0, maxWidth/ colSpan );
            //}
        }
    }
    currCell.setAttribute('data-max-width', maxWidth);
    currCell.setAttribute('data-min-width', minWidth);
    currCell.setAttribute('data-forceFit-minwidth',forceFitMinwidth)
    // if the cell has colspan then it would mean that the max width is split across the spanned cells
    // min width however will remain the same
    for (var ci = colIndex; ci < (colIndex + colSpan); ci++) {
        colDataType[ci]['minWidth'] = Math.ceil(Math.max(colDataType[ci].minWidth, minWidth / colSpan));
        colDataType[ci]['maxWidth'] = Math.ceil(Math.max(colDataType[ci].maxWidth, maxWidth / colSpan));
        colDataType[ci]['forceFitminWidth'] = Math.ceil(Math.max(colDataType[ci].forceFitminWidth?colDataType[ci].forceFitminWidth:0, forceFitMinwidth/colSpan));
    }

    // if we are inside tbody and
    // if we have information about this column from previous iteration
    // try to adjust the datatype base on previous data
    if ((headOrBody === 'tbody') && (typeof (colDataType[colIndex]) != 'undefined')) {
        
        if (colDataType[colIndex]['data-type'] === 'text' && subType!='text' && subType!='') {
            layoutInfo['mixed-dataObj'][colIndex] = layoutInfo['dataObj'][colIndex]
            if(colStats['mixed-data-subtype'].indexOf(colIndex)==-1){
                colStats['mixed-data-subtype'].push(colIndex.toString());
            }
            colDataType[colIndex]['data-type'] = "data"
            mixedColDataType[colIndex] = colDataType[colIndex]
            dataType = 'mixed-data';
            dataPartsArr = [];
        }
        else if (colDataType[colIndex]['data-type'] === 'text') {
            dataType = 'text';
            dataPartsArr = [];
        } else if ((colDataType[colIndex]['data-type'] === 'data') && (colDataType[colIndex]['data-sub-type'] != subType)) {
            layoutInfo['mixed-dataObj'][colIndex] = layoutInfo['dataObj'][colIndex]
            if(colStats['mixed-data-subtype'].indexOf(colIndex)==-1){
                colStats['mixed-data-subtype'].push(colIndex.toString());
            }

            mixedColDataType[colIndex] = colDataType[colIndex]
            dataType = 'mixed-data';
            dataPartsArr = [];
        } else if ((colDataType[colIndex]['data-type'] === 'mixed-data')){
            layoutInfo['mixed-dataObj'][colIndex] = layoutInfo['dataObj'][colIndex]
            if(colStats['mixed-data-subtype'].indexOf(colIndex)==-1){
                colStats['mixed-data-subtype'].push(colIndex.toString());
            }
            mixedColDataType[colIndex] = colDataType[colIndex]
            dataType = 'mixed-data';
            dataPartsArr = [];
        }
        if(colDataType[colIndex]['data-type'] != 'text'){
            if(!colStats['dataTypeIndex'][colIndex]){
                colStats['dataTypeIndex'][colIndex] = {}
            }
            if(!colStats['dataTypeIndex'][colIndex][subType]){
                colStats['dataTypeIndex'][colIndex][subType]=[]
            }
            colStats['dataTypeIndex'][colIndex][subType].push(rowIndex)
            // if(subType!=''){
            //     dataType = 'data'
            // }
            // else{
            //     dataType = colDataType[colIndex]['data-type']
            // }
        } 
    }
    // if the cell is in thead then reset as we do not want this to influence the 'data' type column checks
    if (headOrBody === 'thead') {
        // MMH on 5th April, 2018. If a column in thead have data and its tbody is empty.
        colDataType[colIndex]['data-type'] = '';
        colDataType[colIndex]['data-sub-type'] = '';
        colDataType[colIndex]['tbody-maxLeftPart'] = 0;
        colDataType[colIndex]['tbody-maxRightPart'] = 0;
        
    } else {
        // Checks and force to 'empty' if dataType is "";
        if(['mixed-data'].indexOf(dataType) > -1) dataType = 'data';
        if(['data','text','empty',].indexOf(dataType) < 0) dataType = 'empty';
        if( mixedColDataType &&  mixedColDataType[colIndex]){
            dataType = 'data';
        }
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
function checkInputQuality(changeCharAlignFlag,changeLayoutFlag) {
    return new Promise(function (resolve, reject) {
        if(changeCharAlignFlag && changeCharAlignFlag=='true'){
            $('table').find('tr[currentselection="true"], td[currentselection="true"], th[currentselection="true"]')
            .removeAttr('style')
            .removeAttr('align')
            // .removeAttr('data-align')
            .removeAttr('data-col-width')
            .removeAttr('data-col-index')
            .removeAttr('data-row-index')
            .removeAttr('data-left-indent')
            .removeAttr('data-align-right-width')
            .removeAttr('data-align-left-width')
            .find('p, ul, ol, li, span')
            .removeAttr('style')
            .removeAttr('align')
            .removeAttr('data-align')
            .removeAttr('data-col-width')
            .removeAttr('data-col-index')
            .removeAttr('data-row-index')
            .removeAttr('data-left-indent')
            .removeAttr('data-align-right-width')
            .removeAttr('data-align-left-width')
        }
        else if(changeLayoutFlag&&changeLayoutFlag=="true"){
            $('.jrnlPatterns').contents().unwrap();
            $('table').removeAttr('class')
            .addClass('nowrap')
            .removeAttr('width')
            .removeAttr('style')
            .removeAttr('data-table-type')
            .removeAttr('data-col-widths-px')
            .find('tr, td, th, p, ul, ol, li, span')
            .removeAttr('style')
            .removeAttr('width')
            .removeAttr('fontsize')
            .removeAttr('data-col-width')
            .removeAttr('data-col-index')
            .removeAttr('data-row-index')
            .removeAttr('data-left-indent')
            .removeAttr('data-align-right-width')
            .removeAttr('data-align-left-width')
            ;
        }
        else{
            $('.jrnlPatterns').contents().unwrap();
            $('table').removeAttr('class')
                .addClass('nowrap')
                .removeAttr('width')
                .removeAttr('style')
                .removeAttr('data-table-type')
                .removeAttr('data-col-widths-px')
                .find('tr, td, th, p, ul, ol, li, span')
                .removeAttr('style')
                .removeAttr('width')
                .removeAttr('align')
                .removeAttr('data-align')
                .removeAttr('fontsize')
                .removeAttr('data-col-width')
                .removeAttr('data-col-index')
                .removeAttr('data-row-index')
                .removeAttr('data-left-indent')
                .removeAttr('data-align-right-width')
                .removeAttr('data-align-left-width')
                ;
            }
        $('.del,[data-track="del"],.hidden, .headerRow, .leftHeader,.jrnlDeleted').remove();
        console.log('checkInputQuality');
        resolve(true);
    });
}

function checkIfTableValid(tbl, headOrBody,changeCharAlignFlag) {
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
        var hasWarnings = [];
        var hasErrors = [];

        // total rows and columns
        var totalRows = rows.length;

        /*for Total colcount
         initiating empty array to store rowspan details*/
        var rowMinder=new Array(totalRows).fill(0);
        var mindColspan={};
        
        // to add rowbased colspan from (currentrow+1) 
        mindColspan.add=function(cRow,rowspan,colspan){
            for(var row=1;row<rowspan;row++){
                rowMinder[cRow+row]+=colspan;
            }
        }

        // checking whether row having rowbased colspan or not
        mindColspan.check=function(cRow) {
            return rowMinder[cRow];
        }

        var totalColumns = 0;
        for (var row = 0; row < rows.length; row++) {
            var cells = rows[row].cells;
            var cols = 0;
            for (var col = 0; col < cells.length; col++) {
                var cell = rows[row].cells[col];
                var colspan = parseInt(cell.colSpan);
                var rowspan = parseInt(cell.rowSpan);
                
                // if rowspan found in current-row it will add the col to be added info to comming spanned rows
                if(rowspan>1) mindColspan.add(row,rowspan,colspan);

                if(colspan > 1) cols += colspan;

                else cols++;
            }
            
            //adding rowbased colspan to current-row
            var rowMinderColspan=mindColspan.check(row);
            cols += rowMinderColspan;
            
            totalColumns = Math.max(totalColumns, cols);
        }
        
        // checks, whether total column in tHead and tBody equal or not
        if(headOrBody == 'thead'){
            theadColCount=totalColumns;
            theadEmptyCols=new Array(totalColumns).fill(0);
            theadRowCount=totalRows;
        }
        else{
            tbodyEmptyCols=new Array(totalColumns).fill(0);
            // checking if thead exists, and match total colcount - thead to tbody
            if((theadColCount!=totalColumns)&&(theadColCount)&&(theadRowCount)) hasErrors.push("Total Column count in Head does not match with Body");
         
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
                hasErrors.push('cell outside of table dimensions (cell ' + (row + 1) + ':' + (col + 1) + ' is outside of allowed table size with rows: ' + totalRows + ' and columns: ' + totalColumns + ')');
                return;
            }
            cells[row + ':' + col].count++;
            if (options) {
                if (options.element) {
                    var currCell = options.element;
                    if(changeCharAlignFlag && changeCharAlignFlag=="true"){
                        if (options.element.getAttribute('currentselection') && (!options.element.getAttribute('data-row-index') || !options.element.getAttribute('data-col-index'))) {
                            options.element.setAttribute('data-row-index', row);
                            options.element.setAttribute('data-col-index', col);
                            // check type of data it contains and add necessary attribute
                            analyseData(currCell, col, headOrBody, row);
                        }
                    }
                    else if (!options.element.getAttribute('data-row-index') || !options.element.getAttribute('data-col-index')) {
                        options.element.setAttribute('data-row-index', row);
                        options.element.setAttribute('data-col-index', col);
                        // check type of data it contains and add necessary attribute
                        analyseData(currCell, col, headOrBody, row);
                    }
                }
                cells[row + ':' + col] = $.extend(cells[row + ':' + col], options);
            }
        }
        cells.get = function (row, col) {
            return cells[row + ':' + col];
        }
        cells.count=function(row,col){
            return cells[row + ':' + col].count;
        }

        // init cell matrix
        for (var row = 0; row < totalRows; row++) {
            for (var col = 0; col < totalColumns; col++) {
                cells.init(row, col);
            }
        }

        var colspanInAllRow = true;
        var rowBasedColspan = {};
        var rowBasedColspanCount = {};
        for (var row = 0; row < rows.length; row++) {
                var skip=0;
                var colspanInRow = false;
            for (var col = 0; col < totalColumns; col++) {

                // if cell already updated 
                var cCount = cells.count(row,col);
                if (cCount){
                    skip++;
                    continue;
                }

                // if cell not found;
                var cell = rows[row].cells[col-skip];
                if (!cell) continue;

                // getting rowspan and colspan of current cell
                var rowspan = parseInt(cell.rowSpan);
                var colspan = parseInt(cell.colSpan);
                
                // counting empty columns
                if((rowspan==1) && (colspan==1) && (!cell.innerText && $(cell).find('img').length == 0)) {//updated by Anuraja to avoid image tag as a empty cell
                    if(headOrBody=='thead') theadEmptyCols[col]++;
                    if(headOrBody=='tbody') tbodyEmptyCols[col]++;
                }

                for(var rowadd=0;rowadd<rowspan;rowadd++){
                    for(var coladd=0;coladd<colspan;coladd++){
                        // updating the cells 
                        cells.update(row + rowadd, col + coladd, {
                            element: cell
                        });
                        // for the function - colspan in all cell of same col.
                        if (coladd>0) {
                            colspanInRow=true;
                            if(rowBasedColspan[row+rowadd] && (cell.innerText!='' || $(cell).find('img').length > 0)) {//updated by Anuraja to avoid image tag as a empty cell
                                rowBasedColspan[row+rowadd].push(col+coladd+1);
                                rowBasedColspanCount[row+rowadd].push(colspan);
                                }

                            else if(cell.innerText!='' || $(cell).find('img').length > 0){//updated by Anuraja to avoid image tag as a empty cell
                                rowBasedColspan[row+rowadd] = [(col+coladd+1)];
                                rowBasedColspanCount[row+rowadd] = [colspan];
                            }

                        }

                    }

                }

            }
            
            if(!colspanInRow && cell) {
                colspanInAllRow = false;
            }

        }
        
        if(headOrBody=='tbody'){
            for (var col = 0; col < totalColumns; col++) {
                if((tbodyEmptyCols[col]==totalRows)&&(theadEmptyCols[col]==theadRowCount)) hasWarnings.push("Empty col Found " + (parseInt(col)+1));
                else if ((!theadRowCount)&&(tbodyEmptyCols[col]==totalRows)) hasWarnings.push("Empty col Found " + (parseInt(col)+1));
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

        // this is to check if all body rows has colspan and same column in all rows have the colspan, 
        // then, set that this table has errors and cannot be processed
        if(headOrBody=='tbody' && colspanInAllRow){
            var rowsColspan = Object.keys(rowBasedColspan);
            var firstRowsColspan = rowBasedColspan[rowsColspan[0]];
            var firstRowBasedColspanCount = rowBasedColspanCount[rowsColspan[0]];
            var sameColumnColspan = true;
            for (var [rowKey, row] of rowsColspan.entries()) {
                if(rowKey == 0) continue;
                if(firstRowsColspan.length == 0) sameColumnColspan = false;
                var columnArray = rowBasedColspan[row];
                var columnArrayColspanCount = rowBasedColspanCount[row];
                for(var [columnKey,column] of firstRowsColspan.entries()){
                    var foundIndex = columnArray.indexOf(column);
                    if(foundIndex >= 0 && columnArrayColspanCount[foundIndex] == firstRowBasedColspanCount[foundIndex]){
                        // sameColumnColspan = true;
                    }else{
                        firstRowsColspan.splice(columnKey,1);
                    }
                }
            }
            if( sameColumnColspan ) hasErrors.push('Contains colspan in all rows and same column in each row');
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
            var lastCell = $('td:last');
            var paddingPerCol = parseInt(lastCell.css('padding-left')) + parseInt(lastCell.css('padding-right')) + parseInt(lastCell.css('border-left-width')) + parseInt(lastCell.css('border-right-width'));
            headRows.each(function (rIndex, headRow) {
                var colSpanNodes = $(headRow).find('[colspan]');
                colSpanNodes.each(function (cIndex, colSpanNode) {
                    var rowIndex = parseInt(colSpanNode.getAttribute('data-row-index'));
                    var colSpan = parseInt(colSpanNode.getAttribute('colspan'));
                    var colIndex = parseInt(colSpanNode.getAttribute('data-col-index'));
                    var spannedCellMaxWidth = Math.ceil(parseFloat(colSpanNode.getAttribute('data-max-width'))) + paddingPerCol;
                    var combinedMaxWidth = 0;
                    var endIndex = colSpan + colIndex;
                    for (i = colIndex; i < endIndex; i++) {
                        var childCells = $('thead [data-row-index="' + (rowIndex + 1) + '"][data-col-index="' + i + '"]');
                        childCells.each(function (ccIndex, childCell) {
                            console.log(childCell.textContent, childCell.getAttribute('data-max-width'));
                            combinedMaxWidth += Math.ceil(parseFloat(childCell.getAttribute('data-max-width'))) + paddingPerCol;
                        })
                    }
                    console.log($(this).text(), spannedCellMaxWidth, combinedMaxWidth);
                    if (spannedCellMaxWidth > combinedMaxWidth) {
                        var percentage = spannedCellMaxWidth / combinedMaxWidth;
                        for (i = colIndex; i < endIndex; i++) {
                            var childCells = $('thead [data-row-index="' + (rowIndex + 1) + '"][data-col-index="' + i + '"]');
                            childCells.each(function (ccIndex, childCell) {
                                colDataType[i].maxWidth = Math.ceil(parseFloat((parseFloat($(this).attr('data-max-width')) * percentage).toFixed(2)));
                                //colDataType[i].minWidth = colDataType[i].maxWidth;
                                colDataType[i].minWidth = Math.ceil(Math.max(colDataType[i].minWidth, childCell.getAttribute('data-min-width')));
                            })
                        }
                    }
                    else {
                        for (i = colIndex; i < endIndex; i++) {
                            var childCells = $('thead [data-row-index="' + (rowIndex + 1) + '"][data-col-index="' + i + '"]');
                            childCells.each(function (ccIndex, childCell) {
                                if(colDataType && colDataType[i] && colDataType[i].minWidth){
                                    //colDataType[i].minWidth = Math.ceil(childCell.getAttribute('data-min-width'));
                                    colDataType[i].minWidth = colDataType[i].minWidth;
                                }
                                if(colDataType && colDataType[i] && colDataType[i].maxWidth){
                                    colDataType[i].maxWidth = colDataType[i].maxWidth;
                                    //colDataType[i].maxWidth = Math.ceil(childCell.getAttribute('data-max-width'));
                                }
                            });
                        }
                    }
                });
            });
        }
        /* Taking info which required by space to indent function */
        if(headOrBody=='tbody') {
            layoutInfo.indent.cells = cells;
            layoutInfo.indent.totalColumns = totalColumns;
            layoutInfo.indent.totalRows = totalRows;
        }
        
        // warning
        if(hasWarnings.length>0 && headOrBody=='tbody'){
            layoutInfo['warning']=hasWarnings;
            console.log({
                status:{ code:400,message:"Warning"},
                message:{
                    'log':'Table May be Invalid',
                    'warning':hasWarnings
                }
            });
        }

        if (hasErrors.length > 0) {
            layoutInfo['error'] = hasErrors;
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
 * convert all spaces (data-original-space) to indent.
 */
function spaceToIndent(textColumns,totalRows,cells){
    textColumns.forEach(elCol => {
        for (elRow = 0; elRow < totalRows ; elRow++ ){
            if(cells.get(elRow,elCol).element &&  (space = $(cells.get(elRow,elCol).element).data('original-space')) ) {
                
                /** single space are considered if is an nbsp rather than a normal space  - MMH  */

                // if(space > 1){
                    if(!layoutInfo.dataObj[elCol][elRow]) layoutInfo.dataObj[elCol][elRow] = {};
                    var currEl = cells.get(elRow,elCol);
                    var prevEl = null;
                    if(cells.get(elRow-1,elCol) && cells.get(elRow-1,elCol).element){
                        prevEl = cells.get(elRow-1,elCol).element
                    }
                    //prevEl = cells.get(elRow-1,elCol).element ? cells.get(elRow-1,elCol).element : null;
                     /* no previous cell, then indent is 1 */
                    if(!prevEl) currEl.indent = 1;
                    /* if space almost equal to the previous cell (col-wise), indent given equally */
                    else if(((prevEl.space == space) || (prevEl.space+1 == space)) && (prevEl.indent)) currEl.indent = prevEl.indent;
                    /* no space | indent at previous cell, then indent is 1 */
                    else if(!prevEl.space) currEl.indent = 1;
                    /* if previous cell's space(+2) greater than current space then it's next indent level */
                    else if((prevEl.space+2 <= space) && (prevEl.indent)) currEl.indent = prevEl.indent+1;
                    /* if previous cell's space lower than current space then it's previous indent level */
                    else if((prevEl.space > space) && (prevEl.indent)) currEl.indent = prevEl.indent-1;
                    /* storing space info */
                    currEl.space = space;
                    
                    layoutInfo.dataObj[elCol][elRow].space = space;
                    layoutInfo.dataObj[elCol][elRow].indent = currEl.indent;
                // }
            }
        }
    });
    return true;
}

/**
 * validate table to ensure the columns, rows are valid and does not have extra/insufficient cells
 * https://stackoverflow.com/questions/14536492/validate-correctness-of-html-table-syntax-with-javascript
 *
 */
function validateTable(changeCharAlignFlag) {
    return new Promise(function (resolve, reject) {
        var tbl = document.getElementsByTagName('table');
        if (!tbl[0]) {
            reject('table not found');
            return false;
        }
        tbl = tbl[0];
        checkIfTableValid(tbl, 'thead',changeCharAlignFlag)
            .then(function () {
                return checkIfTableValid(tbl, 'tbody',changeCharAlignFlag);
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
function determineFinalColWidths(changeCharAlignFlag) {
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
        $('#tableContainer').find('colgroup').remove()
        var colGroup = '<colgroup>';
        var lastCell = $('td:last');
        var paddingPerCol = parseInt(lastCell.css('padding-left')) + parseInt(lastCell.css('padding-right')) + parseInt(lastCell.css('border-left-width')) + parseInt(lastCell.css('border-right-width'));
        //var paddingPerCol = parseInt(lastCell.css('padding-left')) + parseInt(lastCell.css('padding-right')) ;
     
            for (var colIndex in colDataType) {
                var currColData = colDataType[colIndex];
                colStats[currColData['data-type']].totalMinWidth += currColData.minWidth;
                colStats[currColData['data-type']].totalMaxWidth += currColData.maxWidth;
                colGroup += '<col id="col' + colIndex + '" width="' + (currColData.minWidth + paddingPerCol) + '"/>'
                tblWidth += currColData.minWidth + paddingPerCol;
                colStats[currColData['data-type']].colIndex.push(parseInt(colIndex));
            }
            var columnCount = parseInt(colIndex) + 1;
            layoutInfo['colTypeIndex']['text'] = colStats["text"]["colIndex"];
            layoutInfo['colTypeIndex']['data'] = colStats["data"]["colIndex"];
            layoutInfo['colTypeIndex']['empty'] = colStats["empty"]["colIndex"];
            layoutInfo['colCount'] = columnCount;
            var paddingSpace = paddingPerCol * columnCount;
            var prevLayoutFailed = false;
            console.log('table width ' + tblWidth);
            if(!changeCharAlignFlag || (changeCharAlignFlag && changeCharAlignFlag=='false')){
            $('#tableContainer').css('overflow', 'auto').css('border', '1px solid');
            $('#tableContainer').css('width', tblWidth).css('min-width', tblWidth).css('max-width', tblWidth);
            $('table').css('table-layout', 'fixed').prepend(colGroup);
            console.log('det 1', new Date())
            // resolve(true);
            // return true;
            // if the calculated table width is greater that possible widths then remove them from array to save iteration
            var shiftIndex = 0;
            var layoutWidthsArr = layoutOptionsArr;
            var layoutWidthsNamesArr = layoutOptionsNamesArr;
            $.each(layoutWidthsArr, function (index, currLayoutWidth) {
                if (currLayoutWidth < tblWidth) {
                    shiftIndex++;
                }
                else {
                    return false;
                }
            });
            // if table width greater than our layout cases, it is pushing to be on max layout.
            shiftIndex = shiftIndex >= layoutOptionsNamesArr.length ? layoutOptionsNamesArr.length-1 : shiftIndex;

            if (shiftIndex > 0) {
                layoutWidthsArr = layoutWidthsArr.splice(shiftIndex);
                layoutWidthsNamesArr = layoutWidthsNamesArr.splice(shiftIndex);
            }
            console.log('det 2', new Date())
            $.each(layoutWidthsArr, function (index, currLayoutWidth) {
                // make sure the body is wide enough to handle the table's width
                console.log(index, new Date())
                var maxTblWidth = Math.max(tblWidth, currLayoutWidth);
                $('#tableContainer').css('width', maxTblWidth).css('min-width', maxTblWidth).css('max-width', maxTblWidth);
                colStats['layout'][index] = {
                    'width': currLayoutWidth,
                    'colWidthArr': [],
                    'tableHeight': 0,
                    'fitsLayout': true
                }
                var availableSpace = currLayoutWidth - colStats.data.totalMinWidth - colStats.empty.totalMinWidth;
                // reduce the available space by space occupied by padding left and right
                availableSpace = availableSpace - ((colStats.data.colIndex.length + colStats.empty.colIndex.length) * paddingPerCol);
                // actual space required by data columns
                maxSpaceReqByDataCol = colStats.data.totalMinWidth + colStats.empty.totalMinWidth + ((colStats.data.colIndex.length + colStats.empty.colIndex.length) * paddingPerCol);
                // maximum space required by text columns
                maxSpaceReqByTextCol = colStats.text.totalMaxWidth + (colStats.text.colIndex.length * paddingPerCol);
                // minimum space required by text columns
                minSpaceReqByTextCol = colStats.text.totalMinWidth + (colStats.text.colIndex.length * paddingPerCol);

                var columnCount = Object.keys(colDataType).length;
                var paddingAndBorderSpace = columnCount * paddingPerCol;
                var maxSpaceReq = colStats.text.totalMaxWidth + colStats.data.totalMaxWidth + colStats.empty.totalMaxWidth + paddingAndBorderSpace;
                var minSpaceReq = colStats.text.totalMinWidth + colStats.data.totalMinWidth + colStats.empty.totalMinWidth + paddingAndBorderSpace;
                var calculatedTableWidth = 0;
                // if the text columns' total min width is greater than available space then try the next layout
                if (minSpaceReq > currLayoutWidth) {
                    console.log('cond 1', new Date())
                    // handling if user request layout
                    if(fixIt && layoutOptionsNamesArr.length===1){
                        // layoutInfo['warning'] = ["Unable to fit the table into '" + fixInToIt + "', as the minimum table width (" + minSpaceReq + ") is greater than the selected layout's width (" + currLayoutWidth + "). You could either choose next possible layout or reduce the font size"];
                        // console.log(layoutInfo['error']);
                        calculatedTableWidth =  forceFit(minSpaceReq,currLayoutWidth,paddingPerCol,index)
                    }
                    if(fixIt && layoutOptionsNamesArr.length===1 && calculatedTableWidth > currLayoutWidth){
                        calculatedTableWidth = forceFit(minSpaceReq,currLayoutWidth,paddingPerCol,index,true)//adjust text columns on force fit when table is not fit by adjusting data columns
                    }
                    if(calculatedTableWidth > currLayoutWidth){    
                        layoutInfo['warning'] = ["Unable to fit the table into " + fixInToIt + ", as the minimum table width (" + minSpaceReq + ") is greater than the selected layouts width (" + currLayoutWidth + "). You could either choose next possible layout or reduce the font size"];
                        console.log(layoutInfo['error']);
                        colStats['layout'][index]['fitsLayout'] = false;
                        return true;
                    }
                    else if(calculatedTableWidth < currLayoutWidth){
                        var remainingWidth = (currLayoutWidth - calculatedTableWidth);
                        if(remainingWidth > 0){
                            calculatedTableWidth = 0
                            var colsToBeDistributed = layoutInfo["reducedColIndex"].length
                            var widthToAdd = colsToBeDistributed? (remainingWidth)/colsToBeDistributed : 0;
                            colStats['layout'][index]['colWidthArr'] = [];
                            for (var colIndex in colDataType) {
                                var colWid = parseInt($('#col' + colIndex).attr('width'))
                                if(layoutInfo["reducedColIndex"].indexOf(colIndex.toString())>=0){
                                    colWid = parseInt($('#col' + colIndex).attr('width')) + widthToAdd;
                                } 
                                //var colWid = parseInt($('#col' + colIndex).attr('width')) + widthToAdd;
                                // if(colDataType[parseInt(colIndex)+1]){
                                //     colWid = Math.round(colWid)
                                // }
                                calculatedTableWidth = calculatedTableWidth+colWid
                                $('#col' + colIndex).attr('width', colWid);
                                colStats['layout'][index]['colWidthArr'].push(colWid);
                            }
                        }
                    }
                    
                   // return true;
                } else if (maxSpaceReq <= currLayoutWidth && !skipFixSpace) {//skip
                    console.log('cond 2', new Date())
                    var lastColumnIndex = columnCount - 1;
                    var lastColMaxWidth = colDataType[lastColumnIndex].maxWidth + paddingPerCol;
                    var percentage = (currLayoutWidth - lastColMaxWidth) / (maxSpaceReq - lastColMaxWidth);
                   
                    var colCount = Object.keys(colDataType).length -1;
                    var totPadding = paddingPerCol*colCount;
                    var availableSpace = currLayoutWidth - (maxSpaceReq);
                    var widthToAdd = availableSpace/colCount
                    var skipExtraSpaceFlag="false";
                    if(skipDistributeExtraSpace){
                        var minSpaceVal = currLayoutWidth * 20/100
                        console.log('curlayout '+currLayoutWidth)
                        if((currLayoutWidth - maxSpaceReq) > minSpaceVal){
                            skipExtraSpaceFlag ="true"
                        }
                    }
                    for (var colIndex in colDataType) {
                        // current column is the last column then we do not
                        if (columnCount == 1) {
                            percentage = 1;
                        }
                       
                        var currColData = colDataType[colIndex];
                        var dataColWidth = currColData.maxWidth;
                      var colWid = parseInt((dataColWidth + paddingPerCol) * percentage);
                        var colWid = parseInt((dataColWidth + paddingPerCol) + widthToAdd)
                        if (columnCount == 1) {
                         colWid = parseInt(dataColWidth + paddingPerCol) 
                        }
                        columnCount--;
                        if(skipDistributeExtraSpace){
                            var minSpaceVal = currLayoutWidth * 20/100
                            console.log('curlayout '+currLayoutWidth)
                            if(skipExtraSpaceFlag && skipExtraSpaceFlag=="true"){
                                colWid = parseInt((dataColWidth + paddingPerCol));
                            }
                        }
                        // if(columnCount!=1){
                        //     colWid = Math.round(colWid)
                        // }
                        var calculatedTableWidth = calculatedTableWidth + colWid;
                        $('#col' + colIndex).attr('width', colWid);
                        colStats['layout'][index]['colWidthArr'].push(colWid);
                        if(skipExtraSpaceFlag && skipExtraSpaceFlag=="true" && columnCount==0){
                            skipFixSpace = true
                        }
                    }
                } else if (minSpaceReq <= currLayoutWidth && !fixIt) {
                    console.log('cond 3', new Date())
                    // Implementation for Adjusting column width based on height given to text columns

                    var widthAdjusted = 0;
                    var adjustFailedInfo = {};
                    //do{
                        calculateMinWidthCallstack = 0;
                        // console.log("space before: ",currLayoutWidth, minSpaceReq,(currLayoutWidth - minSpaceReq - paddingPerCol));
                        widthAdjusted = adjustColumnWidth(layoutInfo.colTypeIndex.text,layoutInfo.indent.totalRows,layoutInfo.indent.cells, (currLayoutWidth - minSpaceReq - paddingPerCol),adjustFailedInfo);
                        // if(widthAdjusted === 0) adjustColCallStack -= 1;
                        if(widthAdjusted) minSpaceReq += widthAdjusted;
                        // console.log("space after: ",currLayoutWidth, minSpaceReq,(currLayoutWidth - minSpaceReq - paddingPerCol));
                        // console.log('widthAdjusted',widthAdjusted);
                    //}while(widthAdjusted !== false && adjustColCallStack <= 30)
                    

                    // var lastColumnIndex = columnCount - 1;
                    // var lastColMinWidth = 0;
                    // the last column should not be increased if its 'data' type column
                    // if (colDataType[lastColumnIndex]['data-type'] != 'text') {
                    //     lastColMinWidth = colDataType[lastColumnIndex].minWidth + paddingPerCol;
                    // }
                    // var percentage = (currLayoutWidth - lastColMinWidth) / (minSpaceReq - lastColMinWidth);
                    for (var colIndex in colDataType) {
                        // current column is the last column then we do not modify column width based on percentage
                        // only if the last column is NOT of type text
                        // if ((columnCount == 1) && (colDataType[lastColumnIndex]['data-type'] != 'text')) {
                        //     percentage = 1;
                        // }
                        // columnCount--;
                        // var currColData = colDataType[colIndex];
                        // var dataColWidth = currColData.minWidth;
                        // var colWid = parseInt((dataColWidth + paddingPerCol) * percentage);
                        // var calculatedTableWidth = calculatedTableWidth + colWid;
                        var colWid = parseFloat($('#col' + colIndex).attr('width')) + paddingPerCol;
                        // if(colDataType[parseInt(colIndex)+1]){
                        //     colWid = Math.round(colWid)
                        // }
                        var calculatedTableWidth = calculatedTableWidth + parseFloat(colWid);
                        $('#col' + colIndex).attr('width', colWid);
                        colStats['layout'][index]['colWidthArr'].push(colWid);
                    }
                    if((currLayoutWidth - calculatedTableWidth) < 0) {
                        colStats['layout'][index]['fitsLayout'] = false;
                        return true;
                    }
                    // after adjusting column based on last line width. Adjust columns based on column type (text has max width distributed comparitively to data columns)
                    var remainingWidth = (currLayoutWidth - calculatedTableWidth);
                    if(remainingWidth > 0){
                        var calculatedTableWidth = 0;
                        var totalTextColumns = colStats['text']['colIndex'].length;
                        var totalDataColumns = colStats['data']['colIndex'].length;
                        var lastCol = colIndex;
                        colDataType[colIndex]['data-type'] == 'data' ? totalDataColumns--:'';
                        colStats['layout'][index]['colWidthArr'] = [];
                        if(skipDistributeExtraSpace){
                            var minSpaceVal = currLayoutWidth * 20/100
                            if(remainingWidth > minSpaceVal){
                                return true;
                            }
                        }
                        var textDistribution = totalTextColumns? parseInt((remainingWidth * 70 / 100)/totalTextColumns) : 0;
                        var dataDistribution = totalDataColumns? parseInt((remainingWidth * 30 / 100)/totalDataColumns) : 0;
                        var colCount = Object.keys(colDataType).length -1;
                        var widthToDist = remainingWidth/colCount
                        for (var colIndex in colDataType) {
                            if(colDataType[colIndex]['data-type'] == 'text'){
                               // var colWid = parseInt($('#col' + colIndex).attr('width')) + textDistribution;
                                var colWid = parseInt($('#col' + colIndex).attr('width')) + widthToDist;
                            }else if(colDataType[colIndex]['data-type'] == 'data' && lastCol != colIndex){
                              //var colWid = parseInt($('#col' + colIndex).attr('width')) + dataDistribution;
                                var colWid = parseInt($('#col' + colIndex).attr('width')) + widthToDist;
                            }else{
                                var colWid = parseInt($('#col' + colIndex).attr('width'));
                            }
                            // if(colDataType[parseInt(colIndex)+1]){
                            //     colWid = Math.round(colWid)
                            // }
                            calculatedTableWidth = calculatedTableWidth + parseInt(colWid);
                            $('#col' + colIndex).attr('width', colWid);    
                            
                            colStats['layout'][index]['colWidthArr'].push(colWid);
                        }
                    }
                }else if(minSpaceReq <= currLayoutWidth){
                    console.log('cond 4', new Date())
                    var lastColumnIndex = Object.keys(colDataType).length; - 1;
                    var remainingWidth = currLayoutWidth - minSpaceReq
                    var totalTextColumn = colStats['text']['colIndex'].length;
                        var totalDataColumn = colStats['data']['colIndex'].length;
                        var colCount = Object.keys(colDataType).length -1;
                        var textDistributionVal = totalTextColumn? parseInt((remainingWidth * 70 / 100)/totalTextColumn) : 0;
                        var dataDistributionVal = totalDataColumn? parseInt((remainingWidth * 30 / 100)/totalDataColumn) : 0;
                        var widthToDist = remainingWidth/colCount
                        var calculatedTableWidth =0
                        for (var colIndex in colDataType) {
                            var colWid = parseInt($('#col' + colIndex).attr('width'));
                            if(colDataType[colIndex]['data-type'] == 'text'){
                                 //colWid = parseInt($('#col' + colIndex).attr('width')) + textDistributionVal;
                               colWid = parseInt($('#col' + colIndex).attr('width')) + widthToDist;
                            }else if(colDataType[colIndex]['data-type'] == 'data' && lastColumnIndex != colIndex){
                                // colWid = parseInt($('#col' + colIndex).attr('width')) + dataDistributionVal;
                                colWid = parseInt($('#col' + colIndex).attr('width')) + widthToDist;
                            }else{
                                 colWid = parseInt($('#col' + colIndex).attr('width'));
                            }
                            // if(colDataType[parseInt(colIndex)+1]){
                            //     colWid = Math.round(colWid)
                            // }
                            calculatedTableWidth = calculatedTableWidth + parseInt(colWid);
                            $('#col' + colIndex).attr('width', colWid);    
                            
                            colStats['layout'][index]['colWidthArr'].push(colWid);
                        }
                }
                console.log('after total width', new Date())
                // if the calculated table width is not equal to the defined column width,
                // distribute the difference between columns
                if ((currLayoutWidth - calculatedTableWidth) != 0) {
                    var colCount = Object.keys(colDataType).length -1;
                    colIndex = colCount
                    //var colCount = parseInt(colIndex) /* + 1 */; // to prevent distributing space to last column
                    // distribute space if last column is a text column
                    if(colDataType[colIndex]['data-type'] == 'text') colCount += 1;
                    if (currLayoutWidth > calculatedTableWidth && !skipDistributeExtraSpace) {
                        var diffInWidth = currLayoutWidth - calculatedTableWidth;
                    }
                    else if (calculatedTableWidth > currLayoutWidth) {
                        var diffInWidth = - (calculatedTableWidth - currLayoutWidth);
                    }
                    else if (currLayoutWidth > calculatedTableWidth && skipDistributeExtraSpace){
                        var diffInWidth = currLayoutWidth - calculatedTableWidth;
                        var minSpaceVal = currLayoutWidth * 20/100
                        if(diffInWidth > minSpaceVal){
                            diffInWidth = 0;
                        } 
                    }
                    var widthToAdd = diffInWidth / colCount;
                    colStats['layout'][index]['colWidthArr'] = [];
                    for (var colIndex in colDataType) {
                        if(colCount == colIndex) widthToAdd = 0;    // to prevent distributing space to last column
                        var colWid = parseInt($('#col' + colIndex).attr('width')) + widthToAdd;
                        // if(colDataType[parseInt(colIndex)+1]){
                        //     colWid = Math.round(colWid)
                        // }
                        $('#col' + colIndex).attr('width', colWid);
                        colStats['layout'][index]['colWidthArr'].push(colWid);
                    }
                }
                if(centerAlignMixedData){
                    layoutInfo['centreAlignCol'] = colStats['mixed-data-subtype'];
                }
                //col width to be whole numbers except last column, round off column width of all columns and add the float value to the last column
                var tempColWidthArr = colStats['layout'][index]['colWidthArr'];
                var tempSumWidth = 0;
                for(var colArrIndex=0;colArrIndex<tempColWidthArr.length-1;colArrIndex++){
                    var widthVal = Math.floor(tempColWidthArr[colArrIndex])
                    colStats['layout'][index]['colWidthArr'][colArrIndex]= widthVal
                    tempSumWidth += widthVal
                }
                console.log('after col width', new Date())
                var diffWidthVal = (currLayoutWidth - tempSumWidth).toFixed(3);
                diffWidthVal= Number(diffWidthVal)
                tempSumWidth += diffWidthVal
                tempSumWidth = tempSumWidth.toFixed(3)
                if(currLayoutWidth - tempSumWidth!=0){
                    diffWidthVal = currLayoutWidth - tempSumWidth
                }
                if(!skipDistributeExtraSpace){
                    colStats['layout'][index]['colWidthArr'][tempColWidthArr.length-1] = diffWidthVal;
                }
                layoutInfo['tableWidth'] = currLayoutWidth;
                layoutInfo['tableWidthName'] = layoutWidthsNamesArr[index];
                layoutInfo['colWidthArr'] = colStats['layout'][index]['colWidthArr'];
                colStats['layout'][index]['tableHeight'] = $('table').height();
                $('#tableContainer').css('width', currLayoutWidth).css('min-width', currLayoutWidth).css('max-width', currLayoutWidth);
                if ((typeof (colStats['layout'][index - 1]) != 'undefined') && (colStats['layout'][index - 1]['fitsLayout'])) {
                    var diffHeight = Math.abs(colStats['layout'][index]['tableHeight'] - colStats['layout'][index - 1]['tableHeight']);
                    var maxHeight = Math.max(colStats['layout'][index]['tableHeight'], colStats['layout'][index - 1]['tableHeight']);
                    var minHeight = Math.min(colStats['layout'][index]['tableHeight'], colStats['layout'][index - 1]['tableHeight']);
                    // Condition A: the current typeset height should be atleast 2/3 less that the previous typeset height
                    // if not having in the current layout is not effective, revert to previous layout and stop
                    // Condition B: if the height of table from previous layout and current layout has not changed
                    if ((colStats['layout'][index]['tableHeight'] == colStats['layout'][index - 1]['tableHeight']) || (minHeight > (maxHeight * 2 / 3))) {
                        var colWidthArr = colStats.layout[index - 1].colWidthArr;
                        colWidthArr.forEach(function (currColWidth, cIndex) {
                            $('#col' + cIndex).attr('width', currColWidth);
                        });
                        var currLayoutWidth = layoutWidthsArr[index - 1];
                        layoutInfo['tableWidth'] = currLayoutWidth;
                        layoutInfo['tableWidthName'] = layoutWidthsNamesArr[index - 1];
                         //col width to be whole numbers except last column, round off column width of all columns and add the float value to the last column
                        var tempColWidthArr = colStats['layout'][index - 1]['colWidthArr'];
                        var tempSumWidth = 0;
                        for(var colArrIndex=0;colArrIndex<tempColWidthArr.length-1;colArrIndex++){
                            var widthVal = Math.floor(tempColWidthArr[colArrIndex])
                            colStats['layout'][index - 1]['colWidthArr'][colArrIndex]= widthVal
                            tempSumWidth += widthVal
                        }
                        var diffWidthVal = (currLayoutWidth - tempSumWidth).toFixed(3);
                        diffWidthVal= Number(diffWidthVal)
                        tempSumWidth += diffWidthVal
                        tempSumWidth = tempSumWidth.toFixed(3)
                        if(currLayoutWidth - tempSumWidth!=0){
                            diffWidthVal = currLayoutWidth - tempSumWidth
                        }
                        if(!skipDistributeExtraSpace){
                            colStats['layout'][index - 1]['colWidthArr'][tempColWidthArr.length-1] = diffWidthVal;
                        }
                        layoutInfo['colWidthArr'] = colStats['layout'][index - 1]['colWidthArr'];
                        $('#tableContainer').css('width', currLayoutWidth).css('min-width', currLayoutWidth).css('max-width', currLayoutWidth);
                        return false;
                    } else {
                        return false;
                    }
                    return false;
                }
            });
            console.log('det 3', new Date())
            for (var colIndex in layoutInfo.dataObj) {
                if(colStats["mixed-data-subtype"].indexOf(colIndex.toString())==-1){
                    for (var rowIndex in layoutInfo.dataObj[colIndex]) {
                        //console.log(colIndex, ',', rowIndex, ' : ', layoutInfo.dataObj[colIndex][rowIndex].leftPartWidth, colDataType[colIndex]['dataLeftPartMaxWidth'])
                        layoutInfo.dataObj[colIndex][rowIndex].leftIndent = colDataType[colIndex]['dataLeftPartMaxWidth'] - layoutInfo.dataObj[colIndex][rowIndex].leftPartWidth;
                        // layoutInfo.dataObj[colIndex][rowIndex].subType = colDataType[colIndex]['data-sub-type'];
                    }
                }
            }
            console.log('det 4', new Date())
            for (var colIndex in layoutInfo.dataObj) {
                if(colStats["mixed-data-subtype"].indexOf(colIndex.toString())>=0){
                    var dataTypes = Object.keys(colStats["dataTypeIndex"][colIndex]);
                    var dataTypesLen = dataTypes.length;
                    var defaultColType = "decimal"
                    var maxDataTypeCount = 0;
                    for(var dataIndex in dataTypes){
                        var curDataTypeLen = colStats["dataTypeIndex"][colIndex][dataTypes[dataIndex]].length
                        if(curDataTypeLen > maxDataTypeCount){
                            maxDataTypeCount = curDataTypeLen
                            defaultColType = dataTypes[dataIndex]
                        }
                    }
                    for (var rowIndex in layoutInfo.dataObj[colIndex]) {
                        if(layoutInfo.dataObj[colIndex][rowIndex].subType && layoutInfo.dataObj[colIndex][rowIndex].subType==defaultColType){
                        //console.log(colIndex, ',', rowIndex, ' : ', layoutInfo.dataObj[colIndex][rowIndex].leftPartWidth, colDataType[colIndex]['dataLeftPartMaxWidth'])
                        layoutInfo.dataObj[colIndex][rowIndex].leftIndent = colDataType[colIndex]['dataLeftPartMaxWidth'] - layoutInfo.dataObj[colIndex][rowIndex].leftPartWidth;
                        // layoutInfo.dataObj[colIndex][rowIndex].subType = colDataType[colIndex]['data-sub-type'];
                    }
                    }
                }
            }
            spaceToIndent(layoutInfo.colTypeIndex.text,layoutInfo.indent.totalRows,layoutInfo.indent.cells);
        }
        else{
            // layoutInfo['colTypeIndex']['text'] = colStats["text"]["colIndex"];
            // layoutInfo['colTypeIndex']['data'] = colStats["data"]["colIndex"];
            // layoutInfo['colTypeIndex']['empty'] = colStats["empty"]["colIndex"];
            for (var colIndex in layoutInfo.dataObj) {
                if(colStats["mixed-data-subtype"].indexOf(colIndex.toString())==-1){
                    for (var rowIndex in layoutInfo.dataObj[colIndex]) {
                        //console.log(colIndex, ',', rowIndex, ' : ', layoutInfo.dataObj[colIndex][rowIndex].leftPartWidth, colDataType[colIndex]['dataLeftPartMaxWidth'])
                        layoutInfo.dataObj[colIndex][rowIndex].leftIndent = colDataType[colIndex]['dataLeftPartMaxWidth'] - layoutInfo.dataObj[colIndex][rowIndex].leftPartWidth;
                        // layoutInfo.dataObj[colIndex][rowIndex].subType = colDataType[colIndex]['data-sub-type'];
                    }
                }
            }
            console.log('det 5', new Date())
            for (var colIndex in layoutInfo.dataObj) {
                if(colStats["mixed-data-subtype"].indexOf(colIndex.toString())>=0){
                    var dataTypes = Object.keys(colStats["dataTypeIndex"][colIndex]);
                    var dataTypesLen = dataTypes.length;
                    var defaultColType = "decimal"
                    var maxDataTypeCount = 0;
                    for(var dataIndex in dataTypes){
                        var curDataTypeLen = colStats["dataTypeIndex"][colIndex][dataTypes[dataIndex]].length
                        if(curDataTypeLen > maxDataTypeCount){
                            maxDataTypeCount = curDataTypeLen
                            defaultColType = dataTypes[dataIndex]
                        }
                    }
                    for (var rowIndex in layoutInfo.dataObj[colIndex]) {
                        if(layoutInfo.dataObj[colIndex][rowIndex].subType && layoutInfo.dataObj[colIndex][rowIndex].subType==defaultColType){
                        //console.log(colIndex, ',', rowIndex, ' : ', layoutInfo.dataObj[colIndex][rowIndex].leftPartWidth, colDataType[colIndex]['dataLeftPartMaxWidth'])
                        layoutInfo.dataObj[colIndex][rowIndex].leftIndent = colDataType[colIndex]['dataLeftPartMaxWidth'] - layoutInfo.dataObj[colIndex][rowIndex].leftPartWidth;
                        // layoutInfo.dataObj[colIndex][rowIndex].subType = colDataType[colIndex]['data-sub-type'];
                    }
                    }
                }
            }
            layoutInfo['tableWidthName'] = $('#tableContainer table').attr('data-table-type')?$('#tableContainer table').attr('data-table-type'):''
            layoutInfo['colCount'] = $('#tableContainer table').attr('data-col-count') ? parseInt($('#tableContainer table').attr('data-col-count')):''
            layoutInfo['colWidthArr'] =  $('#tableContainer table').attr('data-col-widths-px') ? $('#tableContainer table').attr('data-col-widths-px').split(','):[]
        }
        // center based character align data functionality added. this runs only if config is set for customers or projects.
        var borderWidth =  parseInt(lastCell.css('border-left-width')) + parseInt(lastCell.css('border-right-width'))
        var paddingLeft = lastCell.css('padding-left') ? parseInt(lastCell.css('padding-left')) :0
        console.log('det 6', new Date())
        if(centerCharAlign){
            var dataColumnsArray = layoutInfo.colTypeIndex.data;
            for (const colIndex of dataColumnsArray) {
                if(colStats["mixed-data-subtype"].indexOf(colIndex.toString())==-1){
                    var widthAssigned = layoutInfo.colWidthArr[colIndex];
                    var colMaxWidth = colDataType[colIndex]['tbody-maxLeftPart'] + colDataType[colIndex]['tbody-maxRightPart'];
                    var remainingSpaceWidth = widthAssigned - colMaxWidth - borderWidth -  paddingLeft
                    if (remainingSpaceWidth > 0) {
                        var leftMarginToAdd = remainingSpaceWidth / 2;
                        var columnData = layoutInfo.dataObj[colIndex];
                        for (const columnIndex in columnData) {
                            var cellData = columnData[columnIndex];
                            if (cellData && cellData.leftIndent >= 0) {
                                cellData.leftIndent += leftMarginToAdd;
                            }
                        }
                    }
                }
            }
        }
        console.log('det 7', new Date())
        if(centerAlignMixedData){
            var dataColumnsArray = layoutInfo.colTypeIndex.data;
            for (const colIndex of dataColumnsArray) {
               if(colStats["mixed-data-subtype"].indexOf(colIndex.toString())>=0){
                    var widthAssigned = layoutInfo.colWidthArr[colIndex];
                    var colMaxWidth = colDataType[colIndex]['tbody-maxLeftPart'] + colDataType[colIndex]['tbody-maxRightPart'];
                    var remainingSpaceWidth = widthAssigned - colMaxWidth - borderWidth -  paddingLeft
                    if (remainingSpaceWidth > 0) {
                        var leftMarginToAdd = remainingSpaceWidth / 2;
                        var columnData = layoutInfo.dataObj[colIndex];
                        for (const columnIndex in columnData) {
                            var cellData = columnData[columnIndex];
                            if (cellData && cellData.leftIndent >= 0) {
                                cellData.leftIndent += leftMarginToAdd;
                            }
                            else if(cellData && cellData.leftPartWidth){
                                var leftIndent = colDataType[colIndex]['dataLeftPartMaxWidth'] - cellData.leftPartWidth;
                                cellData.leftIndent=leftIndent+leftMarginToAdd
                            }
                        }
                    }
                }
            }
        }
        console.log('det 8', new Date())
        layoutInfo['colDataType']=colDataType
        resolve(layoutInfo);
    });
}

function verticalAlign(){
    var hValign = $('#tableContainer table thead td').css('vertical-align');
    var bValign = $('#tableContainer table tbody td').css('vertical-align');
    hValign = (hValign=='top'||hValign=='bottom') ? hValign : false;
    bValign = (bValign=='top'||bValign=='bottom') ? bValign : false;
    return {'thead':hValign,'tbody':bValign}
}
/**
 *
 */
function typesetTable() {
    console.log('window loaded', new Date());
    $('body').append('<table id="dummy"/>');
    
    // if User Request for layout
    fixInToIt = $('#tableContainer table').attr('data-table-type-fix');
    var changeCharAlignFlag = $('#tableContainer table').attr('data-change-align') ? $('#tableContainer table').attr('data-change-align'):'false'
    var changeLayoutFlag = $('#tableContainer table').attr('data-table-type-fix') ? 'true':'false'
    layoutOptionsNamesArr = fixInToIt ? [fixInToIt] : layoutOptionsNamesArr;
    fixIt = fixInToIt ? true : false;
    var layoutPrefix = $('#tableContainer table').attr('data-layout-prefix') ? $('#tableContainer table').attr('data-layout-prefix'):'LAYOUT1'
    var tempLayoutOptionsNames=[];
    // checking and removing layoutinfo if is not defined in table-config;
    layoutOptionsNamesArr.forEach(function(curLayout,index){
        $('#dummy').attr('data-table-type', curLayout)
        if(layoutPrefix && layoutPrefix!='LAYOUT1'){
            $('#dummy').attr('data-layout-prefix', layoutPrefix)
        }
        if($('#dummy').outerWidth()>10){
            var layoutWidth = parseFloat(window.getComputedStyle(document.querySelector('#dummy') ).minWidth);
            layoutOptionsArr.push(layoutWidth);
            tempLayoutOptionsNames.push(curLayout);
        }
    });
    $('#dummy').remove();
    layoutOptionsNamesArr = tempLayoutOptionsNames;
    
    // if layoutOptionNamesArr is empty it should through an error with "no config found"
    if(!layoutOptionsNamesArr.length){
        layoutInfo['error']=["table Config Missing"];
        console.log(layoutInfo['error']);
    }
    
    var fontSizeChange = {};
    fontSizeChange['thead'] = $('#tableContainer table thead').attr('data-font-size');
    fontSizeChange['tbody'] = $('#tableContainer table tbody').attr('data-font-size');

    if(fontSizeChange['thead'] || fontSizeChange['tbody']){
        layoutInfo['fontSizeChange'] = fontSizeChange;
    }
    console.log('vertical', new Date());
    /* vertical alignment 110718*/
    layoutInfo.align.valign = verticalAlign();
    if(centerAlignTblHead){
        layoutInfo.align.text["thead"] ="center"
    }

    if(centerAlignTblBody){
        layoutInfo.align.text["tbody"] ="center"
    }
   

    rangy.init();

      
    console.log('checkInputQuality', new Date());
    checkInputQuality(changeCharAlignFlag,changeLayoutFlag)
        .then(function (data) {
            console.log('validateTable', new Date());
            return validateTable(changeCharAlignFlag);
        })
        .then(function (d) {
            $("table").removeAttr('border').removeClass('nowrap').css("white-space", "");
            $('style').remove();
            console.log('before determineFinalColWidths', new Date());
            return determineFinalColWidths(changeCharAlignFlag);
        })
        .then(function (l) {
            console.log('get final layoutInfo', new Date());
            console.log(JSON.stringify(l))
            return l;
        })
        .catch(function (e) {
            console.log('error', e);
            if( layoutInfo['error'] && !layoutInfo['error'].length) layoutInfo['error'] = ["Error occurred while setting the table"];
        });
    
}
/**
 * start the process when the window has loaded
 */
// (function () {
//     $(window).on('load', function () {
//         if ($('table').length > 0) {
//             typesetTable();
//         }
//     });
// })();

function getLastlineWidth(element,forceReturnWidth = false) {
    var lastlineWidth = 0;
    var foundOneLine = false;
    var clonedElement = $(element[0]).clone(true);
    var paraInTD = $(element[0]).find('p');
    var multiplePara = paraInTD.length > 1 ? true : false;
    var [totalHeight,oldParaHeight] = [0,0];
    
    if(multiplePara){
        element = paraInTD[paraInTD.length - 1];
        for (let index = 0; index < paraInTD.length - 1; index++) {
            oldParaHeight += $($(paraInTD).get(index)).height();
        }
    }
    $(element).each(function(){
        var current = $(this);
        
        if(multiplePara)     var parentNode = $(this).closest('td');
        else                 var parentNode = current;
        
        var parentHeight = parentNode.height();
        var text = current.text();
        var words = text.split(' ');

        current.text(words[0]);
        var height = current.height(); 
        totalHeight += height;

        if(parentHeight && height && parentHeight == height){
            foundOneLine = true;
        }
        var lastLineWords = $('<span></span>');
        for(var i = 1; i < words.length; i++){
            current.text(current.text() + ' ' + words[i]);
            if((current.height() + oldParaHeight) == parentHeight){
                for(var j=i;j<words.length;j++){
                    lastLineWords.append(" " + words[j]);
                }
                current.html('<p>' + lastLineWords[0].outerHTML + '</p>');
                lastlineWidth = current.find('span').width();
                break;
            }
        }
        if(multiplePara)    current.closest('td').html(clonedElement.html());
        else                current.html(clonedElement.html());
        // oldParaHeight += $(this).height();
    });
    if(lastlineWidth && forceReturnWidth) return lastlineWidth;
    else if(lastlineWidth && !foundOneLine) return lastlineWidth;
    else return false;
}

var adjustColCallStack = 0;
var calculateMinWidthCallstack = 0;
function calculateMinWidthRequired(element,colIndex,oldColWidth,oldMinWidth,wordWidth,reduced){
    calculateMinWidthCallstack++;
    var newValue = 0;
    if(reduced){
        newValue = Math.round(oldMinWidth/2);
        if(newValue <= 2) return newValue;
    }else{
        newValue = oldMinWidth + Math.round(oldMinWidth/2);
    }
    var oldHeight = $(element).height();
    $('#col' + colIndex).attr('width', parseInt($('#col' + colIndex).attr('width')) + newValue);
    var newHeight = $(element).height();
    $('#col' + colIndex).attr('width', oldColWidth);
    if(calculateMinWidthCallstack > 10 && reduced) return oldMinWidth;
    if(newValue > wordWidth) return wordWidth;
    else if(reduced && (newHeight < oldHeight) && (Math.floor(oldMinWidth - newValue)) <= 1) return newValue;
    else if(!reduced && (newHeight < oldHeight) && (Math.floor(newValue - oldMinWidth)) <= 1) return newValue;
    else if(newHeight < oldHeight){
        return calculateMinWidthRequired(element,colIndex,oldColWidth,newValue,wordWidth,true);
    }else if(newHeight == oldHeight){
        return calculateMinWidthRequired(element,colIndex,oldColWidth,newValue,wordWidth,false);
    }
}

function adjustColumnWidth(textColumns,totalRows,cells, availableWidth,adjustFailedInfo){
    // adjust Column Width based on height reduction of a particular cell
    // if more than one cell across rows has same cell height, priotitise cell that has lowest last line width
    // and if more than one cell on a column has same cell height, priotitise cell that has lowest last line width
    
    var maxCellHeights = [];
    var maxCellElements = [];
    var minLastLineWidth = [];
    var adjustColumnWidthFailed = false;
    textColumns.forEach(elCol => {
        for (elRow = 0; elRow < totalRows ; elRow++ ){
            if(cells.get(elRow,elCol).element && (height = getChildrenHeight(cells.get(elRow,elCol).element)) ) {
                if(adjustColCallStack && elRow == 0 && (colDataType[elCol].maxCellHeight || colDataType[elCol].minLastLineWidth)) [colDataType[elCol].maxCellHeight,colDataType[elCol].minLastLineWidth] = [0,0]; 
                if( adjustFailedInfo[elCol] && adjustFailedInfo[elCol]['cells'] && adjustFailedInfo[elCol]['cells'].indexOf(cells.get(elRow,elCol).element) > -1) continue;
                if((colDataType[elCol].maxCellHeight && colDataType[elCol].maxCellHeight <= height) || (colDataType[elCol].maxCellHeight == 0)){
                    var lastLineWidth = getLastlineWidth([$(cells.get(elRow,elCol).element)],true);
                    if(colDataType[elCol].minLastLineWidth == 0 || colDataType[elCol].minLastLineWidth > lastLineWidth){
                        colDataType[elCol].maxCellHeight = maxCellHeights[elCol] = height;
                        colDataType[elCol].maxCellHeightElement = maxCellElements[elCol] = cells.get(elRow,elCol).element;
                        colDataType[elCol].minLastLineWidth = minLastLineWidth[elCol] = lastLineWidth;
                    }
                }
            }
        }
    });
    // replace empty elements with '0'
    maxCellHeights = Array.from(maxCellHeights, item => item || 0);
    
    var colIndexOfMaxVals = maxCellHeights.indexOf(Math.max(...maxCellHeights));
    
    var minLastLineWidthVal = undefined;
    var minLastLineWidthIndex = undefined;
    var minLasLineWidthAndMaxColHeight = (() => {
            for (var [key, elem] of maxCellHeights.entries()) {
                if(maxCellHeights[colIndexOfMaxVals] == elem){
                    if(!minLastLineWidthVal || minLastLineWidth[key] < minLastLineWidthVal){
                        minLastLineWidthVal = minLastLineWidth[key];
                        minLastLineWidthIndex = key;
                    }
                }
                if(((maxCellHeights.length - 1) == key) && minLastLineWidthIndex != undefined ){
                    return {"key": minLastLineWidthIndex};
                }else if( ((maxCellHeights.length - 1) == key) && minLastLineWidthIndex == undefined){
                    return false;
                }
            }
        })();
    if(minLasLineWidthAndMaxColHeight) colIndexOfMax = minLasLineWidthAndMaxColHeight.key;
    else colIndexOfMax = colIndexOfMaxVals;
    
    var wordWidth = getLastlineWidth([maxCellElements[colIndexOfMax]]);
    if(!wordWidth){
        return false;
    }
    // else if(wordWidth > availableWidth){
    //     return false;
    // }
    var heightReduced = false;
    var oldHeight = $(maxCellElements[colIndexOfMax]).height();
    $('#col' + colIndexOfMax).attr('width',parseInt($('#col' + colIndexOfMax).attr('width')) + wordWidth ); 
    var newHeight = $(maxCellElements[colIndexOfMax]).height();
    if(oldHeight > newHeight) heightReduced = true;
    $('#col' + colIndexOfMax).attr('width',parseInt($('#col' + colIndexOfMax).attr('width')) - wordWidth ); 
    if(oldHeight == newHeight) return false;
    var widthToAdd = calculateMinWidthRequired(maxCellElements[colIndexOfMax],colIndexOfMax,$('#col' + colIndexOfMax).attr('width'),wordWidth,wordWidth,heightReduced);
    adjustColCallStack++;
    if(!widthToAdd){
        // to keep track of failed process
        if(adjustFailedInfo[colIndexOfMax] && adjustFailedInfo[colIndexOfMax]['cells']) adjustFailedInfo[colIndexOfMax]['cells'].push(maxCellElements[colIndexOfMax]);
        else adjustFailedInfo[colIndexOfMax] = {"cells": [maxCellElements[colIndexOfMax]]};

        return 0;
    }
    else if( widthToAdd && ( widthToAdd > parseInt($('#col' + colIndexOfMax).attr('width'))/2 ) ){  // if widthToAdd is greater than half of column width
        // to keep track of failed process
        if(adjustFailedInfo[colIndexOfMax] && adjustFailedInfo[colIndexOfMax]['cells']) adjustFailedInfo[colIndexOfMax]['cells'].push(maxCellElements[colIndexOfMax]);
        else adjustFailedInfo[colIndexOfMax] = {"cells": [maxCellElements[colIndexOfMax]]};

        return 0;
    }
    else{
        var paddingPerCol = parseInt($(maxCellElements[colIndexOfMax]).css('padding-left')) + parseInt($(maxCellElements[colIndexOfMax]).css('padding-right')) + parseInt($(maxCellElements[colIndexOfMax]).css('border-left-width')) + parseInt($(maxCellElements[colIndexOfMax]).css('border-right-width'));
        $('#col' + colIndexOfMax).attr('width', parseInt($('#col' + colIndexOfMax).attr('width')) + widthToAdd);
        colDataType[colIndexOfMax].minWidth = parseInt($('#col' + colIndexOfMax).attr('width'));
        if(adjustFailedInfo[colIndexOfMax] && adjustFailedInfo[colIndexOfMax]['cells']) delete adjustFailedInfo[colIndexOfMax];
        return widthToAdd;
    }
}

// get height of children. Introduced to get actual height instead of td's siblings height
function getChildrenHeight(elem){
    var height = 0;
    $(elem).children().each(function(){
        height += $(this).height()
    })
    return height;
}
function addLogicalBreaksToLinks(currLink) {
    var linkStr = currLink;
    //var linkStr = 'http://dx.doi.org/10.1136/openhrt-2016-000417';
    //linkStr = 'http://static.www.bmj.com/sites/default/files/responseattachments/2015/10/Figure%20271015.docx';
    var lineBreakChar = "\u200B";//String.fromCodePoint(0x200B);
    // split the given link into protocol and remaining part
    var linkPartsArr = /^(https?:\/\/(?:www\.)?|www\.)(.*)$/g.exec(linkStr);
    if (linkPartsArr == null) {
        linkPartsArr = ['', '', linkStr];
    }
    var protocolStr = linkPartsArr[1];
    // split the remaining part of the link into array
    var temp = linkPartsArr[2];
    var processedLinkStrArr = [protocolStr + lineBreakChar];
    var index = 0;
    // if the temp string begins with alphanumeric characters and has a punctuation then take that part alone for processing 
    while ((/^.*?[^a-z0-9]/i.test(temp)) || (index++ < 25)) {
        var tempArr = /(.*?)([^a-z0-9])/i.exec(temp);
        temp = temp.replace(/^.*?[^a-z0-9]/i, '');
        if (tempArr == null) {
            var linkStrPart = temp;
            var linkStrPunc = '';
            index = 100; // push the index to higher value so the loop will break
        }
        else {
            var linkStrPart = tempArr[1];
            // if length of string before the punctuation is one, then its not okay to split the string at that point
            // so skip adding the link break character for that punctuation
            if (linkStrPart.length == 1) {
                var linkStrPunc = tempArr[2];
            }
            else {
                var linkStrPunc = tempArr[2] + lineBreakChar;
            }
        }
        // as a design assumption we try to split the character only if we have a minimum of 8 characters
        // we split at 4 characters
        if (linkStrPart.length > 20) {
            var currStrArr = linkStrPart.match(/.{1,4}/g)
            // merge the last element of the array with its previous element and remove the last element
            // this is done to avoid leaving those characters on a separate line on the proof
            var len = currStrArr.length;
            if (len > 1) {
                currStrArr[len - 2] = currStrArr[len - 2] + currStrArr[len - 1]
                currStrArr.pop();
            }
            processedLinkStrArr = processedLinkStrArr.concat(currStrArr.join(lineBreakChar));
        }
        if ((linkStrPart + linkStrPunc) != '') {
            processedLinkStrArr.push(linkStrPart + linkStrPunc);
        }
    }
    // if the last character is a punctuation then the lineBreakChar would have been added before it. please remove.
    var processedLinkStr = processedLinkStrArr.join('');
    return processedLinkStr;

}
function forceFit(minSpace,currLayoutWidth,paddingPerCol,layoutIndex,adjustTextCols){
    var spaceToReduce = minSpace - currLayoutWidth;
    var columnCount = Object.keys(colDataType).length;
    var calculatedTableWidth =0;
    for (var colIndex in colDataType) {
        // current column is the last column then we do not
        columnCount--;
        var currColData = colDataType[colIndex];
        var dataColWidth = currColData.minWidth;
        var dataColLeftPart = currColData["tempLeftPartMaxWidth"];
        var theadColWidth = currColData['thead-minwidth'];
        if(spaceToReduce > 0){
            if(adjustTextCols && currColData.forceFitminWidth){
                var forcefitMinWidthVal = currColData.forceFitminWidth;
                var orgMinWidth =currColData.minWidth
                if(orgMinWidth > forcefitMinWidthVal){
                    currColData.minWidth = forcefitMinWidthVal
                    var reducedVal = orgMinWidth - currColData.minWidth
                    spaceToReduce = spaceToReduce - reducedVal;
                    layoutInfo['reducedColIndex'].push(colIndex)
                }
            }
            else if(dataColLeftPart && theadColWidth>dataColLeftPart){
                var orgMinWidth =currColData.minWidth
                currColData.minWidth = theadColWidth
                var reducedVal = orgMinWidth - currColData.minWidth
                spaceToReduce = spaceToReduce - reducedVal;
                layoutInfo['reducedColIndex'].push(colIndex)
            }
            else if(dataColLeftPart && dataColLeftPart>0){
                var orgMinWidth =currColData.minWidth
                currColData.minWidth = dataColLeftPart
                var reducedVal = orgMinWidth - currColData.minWidth
                spaceToReduce = spaceToReduce - reducedVal
                layoutInfo['reducedColIndex'].push(colIndex)
            }
        }
        var colWid = parseInt((currColData.minWidth + paddingPerCol));
        // if(skipDistributeExtraSpace){
        //     var minSpaceVal = currLayoutWidth * 20/100
        //     console.log('curlayout '+currLayoutWidth)
        //     if(skipExtraSpaceFlag && skipExtraSpaceFlag=="true"){
        //         colWid = parseInt((dataColWidth + paddingPerCol));
        //     }
        // }
        // if(columnCount!=1){
        //     colWid = Math.round(colWid)
        // }
        calculatedTableWidth = calculatedTableWidth + colWid;
        
        $('#col' + colIndex).attr('width', colWid);
        colStats['layout'][layoutIndex]['colWidthArr'].push(colWid);
        // if(spaceToReduce==0){
        //     return;
        // }
        
    }
    return calculatedTableWidth
}