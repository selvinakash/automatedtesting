$(document).ready(function () {
    populateData()
    $('#jobsContainer ul').height($(window).height() - $('#jobsContainer ul').position().top);
    $('#jobObject').height($(window).height() - $('#jobObject').position().top - 75);

    $('body').on('click', 'ul.collection li[id]', function () {
        var param = {};
        param.jobid = $(this).attr('id');
        param.reqRows = "numTotalTests, numPassedTests, numFailedTests, numTotalTestSuites, numPassedTestSuites, numFailedTestSuites, logs";
        $.ajax({
            url: "/populateData",
            type: 'POST',
            data: param,
            success: function (resp) {
                if (resp[0].logs) resp[0].logs = resp[0].logs.split("\n");
                $('#jobObject').jsonViewer(resp)
            },
            error: function (err) {
    
            }
        })
    })
})



function createNode(node, className, id, appendTo) {
    return $(node, {
        class: className,
        id: id
    }).appendTo(appendTo);

}

function generateUrl(parentNode, jobid) {
    var anchorNode = $("<a>", {
        class: "reportLink"
    })
    anchorNode.text("View report")
    var anchorLink = `./viewResult/${jobid}`
    anchorNode.attr("href", anchorLink);
    anchorNode.attr("target", "_blank");
    parentNode.append(anchorNode);
}

function addRowToDom(data) {
    var { jobid } = data
    createNode("<li>", "collection-item", jobid, ".collection")
    createNode("<div>", "row", `${jobid}div`, `#${jobid}`)
    var node = createNode(`<div>`, "col-3", null, `#${jobid}div`)
    node.text(data.dateTime)

    node = createNode(`<div>`, "col-3", null, `#${jobid}div`)
    node.text(data.testFile)

    node = createNode(`<div>`, "col-3", null, `#${jobid}div`)
    node.text(data.status)

    node = createNode(`<div>`, "col-3", null, `#${jobid}div`)
    generateUrl(node, jobid)

}

function populateData() {
    $.ajax({
        url: "/populateData",
        type: 'POST',
        success: function (rows) {
            for (let rIdx = rows.length - 1; rIdx >= 0; rIdx--) {
                var curRow = rows[rIdx];
                addRowToDom(curRow)
            }
        },
        error: function (err) {
            console.log(err);
        }
    })
}