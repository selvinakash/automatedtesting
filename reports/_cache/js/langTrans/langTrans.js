/* testing tables */
var inputTable;
var tableRowInfo = [];

var max = 2;
var Maxwidth = workingWidth() ? workingWidth() : 340.157;

var inputFirstTable = '#inputTable table:first-child';
var tableToAppendFR = '#testArea table:last-child tr:first-child';
var tableToAppendLR = '#testArea table:last-child tr:last-child';
var forColwidthArr = "#testArea table:last-child";
var tableAppendStr = "<table><tbody><tr></tr><tr></tr></tbody></table>";

var tableInfo = {
    tables : 0,
    colInfo:[],
};

tableInfo.colInfo[tableInfo.tables] = [];
var colIndex = -1;var data = true;var  width = 0;

function workingWidth(){
    $('body').append('<div id="Wwidth"/>');
    var width = $('#Wwidth').outerWidth();
    $('#Wwidth').remove();
    return width;
}

/* maximum skip col fixer */
function fixMax(skip){
    max = skip.length;
}

/* function calculate all the columns width (max) */
function widhtCalc(){
    console.log('width Calc');
    var table = $(inputFirstTable);
    var widthArr = [];
    $('table tr:eq('+(table.length-2)+')').each(function(i){
		$(this).children('td').each(function(j,val){
            var width = selectRange($(this)[0],$(this).text().trim());
            var width2 = selectRange($('table tr:eq('+(table.length-1)+') td:eq('+j+')')[0],$('table tr:eq('+(table.length-1)+') td:eq('+j+')').text().trim());
            console.log(width +" = "+ width2);

            if ((/(\d+\.)|(\(\d+\))/g).test($('table tr:eq('+(table.length-1)+') td:eq('+j+')').text().trim()) && (j<2)) {
                width = 37;width2 = 37;
            }
            else if((/(\w\.)|(\(\w\))/g).test($('table tr:eq('+(table.length-1)+') td:eq('+j+')').text().trim()) && (j<2)){
                width = 18;width2 = 18;
            }else{
				width = (Math.max(width,width2)) + 6;
			}

            widthArr.push(width);
        });
    });
    return widthArr;
}

/* final step to load table */
function loadTable(skip){
    tableAppend(skip);
	var widthNow = 0;
	var table = $(inputFirstTable+' tr');
	$('table tr:eq('+(table.length-2)+')').each(function(i){
	$(this).children('td').each(function(j){
		if((widthNow+widthArr[j])>Maxwidth){
			colIndex = -1;
			tableInfo.tables++;
			tableInfo.colInfo[tableInfo.tables] = [];
			widthNow = tableAppend(skip);
			//widthNow = 0;
		}
			colIndex++;
			data = true;
			width = widthArr[j];
			tableInfo.colInfo[tableInfo.tables].push({'colIndex':colIndex,'data':data,'width':width});

			widthNow+=widthArr[j];
			toAppend = $(this);
			subAppend(toAppend,j,table);
		});
	});
	return tableInfo.colInfo;
}

/* sub function to load table */
function subAppend(toAppend,j,table){
    $(tableToAppendFR).append(toAppend);
    $(tableToAppendFR+" td:last-child").attr({'width':widthArr[j],'data-col-width':widthArr[j]});
    toAppend = $(inputFirstTable +' tr:eq('+(table.length-1)+') td:eq(0)');
    $(tableToAppendLR).append(toAppend);
    
}

/* on new table */
function tableAppend(skip){
	var totalWidth = 0;
    if($('#testArea table').length){
        $('#testArea').append(tableAppendStr);
        for(skp=0;skp<skip.length;skp++){
            $(tableToAppendFR).append('<td></td>');
            $(tableToAppendLR).append('<td></td>');
            $(tableToAppendFR +" td:last-child").attr({'width':widthArr[skp],'data-col-width':widthArr[skp]});
            
            colIndex++;
            data = false;
            width = widthArr[skp];
			totalWidth += width;
            tableInfo.colInfo[tableInfo.tables].push({'colIndex':colIndex,'data':data,'width':width});
        }
    }
    else{
        $('#testArea').append(tableAppendStr);
    }
	return totalWidth;
}

/* from microservice to get width */
function selectRange(element,text){
    var range = rangy.createRange();
    var searchScopeRange = rangy.createRange();
    searchScopeRange.selectNodeContents(element);
    var options = {
        caseSensitive: false,
        wholeWordsOnly: false,
        withinRange: searchScopeRange,
        direction: "forward" // This is redundant because "forward" is the default
    };
    if (text == "") {
        return 0;
    } else if (text != undefined) {
        range.selectNodeContents(element);
        if (range.findText(text, options)) {
            range.select();
            var currSelWidth = getSelectionWidth();
            return currSelWidth;
        } else {
            console.log('text : ', text);
        }
    }
}

/* from microservice to get width */
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

/* function to found no of column to be skipped on further new tables */
function skipFounder(){
    console.log('skip Founder');
    var skip = [];
    var textC='',textN='';
    for(col=0;col<max;col++){
        textC = $(inputFirstTable+' tr:first-child td:eq('+col+')').text().trim();
        textN = $(inputFirstTable+' tr:last-child td:eq('+col+')').text().trim();
        if(((/(\d+\.)|(\(\d+\))|(\w(\"\'|\.|\:))|(\d+\w+\.)|(\w+(\'|\")\:)/g).test(textC)) && (!textN)){
            console.log(textC);
            skip.push(col);
        }
    }
    fixMax(skip);
    skipFilter(skip);
    return skip;
}

/* will check all the other table leave the same column empty else it will dec skip count */
function skipFilter(skip){
    console.log('skip Founder');
    if(inputTable.length>1){
        for(table = 1;table<inputTable.length;table++){
            for(col=0;col<max;col++){
                textC = $('#inputTable table:eq('+table+') tr:first-child td:eq(0)').text().trim();
                textN = $('#inputTable table:eq('+table+') tr:last-child td:eq(0)').text().trim();
                if(textC && textN){
                    console.log('came',table,col);
                    skip.pop();
                    fixMax(skip);
                }else{
                    $('#inputTable table:eq('+table+') tr:first-child td:eq(0)').remove();
                    $('#inputTable table:eq('+table+') tr:last-child td:eq(0)').remove();
				}
            }
        }
        return skip;
    }
    return false;
}

/* merge all the table into single as continuation of first one  */
function mergeTable(){
    console.log('merging tables...');
    var tblLen = inputTable.length;
    for(t=1;t<tblLen;t++){
        var curTable = inputTable[t];
        if(tableRowInfo[t]!=2){
            console.log('found more rows');
            return false;
        }
        else{
            var curLength = curTable.rows.length;
            for(row=0;row<curLength;row++){
                $(inputFirstTable+' tr:eq('+row+')').append(curTable.rows[row].cells);
            }
        }
    }
    removeEmptyTables();
}

/* removing empty table from #inputTable */
function removeEmptyTables(){
    console.log('removing Empty tables...');
    var len = inputTable.length;
    var del = true,rowLen = 0;
    for(t=1;t<len;t++){
        rowLen = inputTable[t].rows;
        for(row = 0;row < rowLen;row++){
            if(inputTable[t].rows[row].cells.length!=0) del = false;
        }   
        if(del)
        inputTable[t].remove();
    }
}

/* all the following functions are jus a confirmation for input, can be minimized or avoided */
function preLoadTable(tableString = null){
    console.log('preLoadTable..');
    tableString = $('#inputTable').html();
    if(tableString){
        $('#inputTable').html(tableString);
        inputTable = $('#inputTable table')
        if(inputTableLen())
        {
            var tablesInfo = director();
            return tablesInfo;
        }
        return false;
    }
    return false;
}

function inputTableLen(){

    if(inputTable.length){
        inputTable.each(function (index,table){
            textTableRows(table,index);
        });
    }

    else{
        console.log('no-table Found');
        return false;
    }
    console.log('inputTableLen calc');
    return true;
}


function textTableRows(table,index){
    
    var length = table.rows.length;
    tableRowInfo.push(length);
    console.log(tableRowInfo);
    if(length!=2)
        console.log(index," tableRows differs ",length)
    else
        console.log(index," proceeding ",length);

    return true;
}

/* -- function call all subfunction and return the output array ---- */
function director(){
    rangy.init();
    var skip = skipFounder();
    
    if(inputTable.length>1){
        mergeTable();
    }
    else removeEmptyTables();

    widthArr = widhtCalc();
    if(!widthArr) return 'failed to calculate width';

    return loadTable(skip);
}