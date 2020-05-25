/***************************************************************************************************************************************************
 *
 *	FUNCTION:		Interactive chart from JSON data 
 *
 *	VERSION:		1.2
 *
 *	DATE:			23/05/2020
 *
 *	AUTHOR:			KW - AIT
 *
 *	DESCRIPTION:		For use with ION9000 XML data report. Can scroll and zoom areas of interest with sllider at the bottom
 *	PUBLIC FUNCTIONS:	
 *
 *	PRIVATE FUNCTIONS:
 *
 *	INPUT PARAMETERS:
 *
 *	OUTPUT PARAMETERS:	
 *
 *	NOTES:			Use http://www.utilities-online.info/xmltojson/#.XskLCMARWHt to convert XML to JSON then clean using JSON-clean.js
 *
 ***************************************************************************************************************************************************/
var data;
let sel, dataSelect;
let dataRecorders;
let dataRecord;
let checkboxes = [];
let chartHeight;
let start = 0;
let end = 150;
let indxSelected;
let itemSelected;
let title;
var g3;

function setup() {
  createCanvas(1000, 280);
  data = loadJSON('data-20200427.json', loadedJSON);
  textAlign(LEFT);
  background(200);
  chartHeight = document.getElementById("graphdiv2").offsetHeight + 20;
  dataSelect = createSelect();
  dataSelect.id('eltDataSelect');
  dataSelect.position(10, chartHeight + 10);
  dataSelect.option("Woodland's 27th April");
  dataSelect.option("Riversand's 07th May");
  dataSelect.option("Riversand's 11th May");
  dataSelect.option("Riversand's 13th May");
  dataSelect.changed(siteSelectEvent);
  dataSelect = document.getElementById("eltDataSelect");
  fill(0);
  textSize(16);
  textFont('Helvetica');
  text('Channels:', 360, 25)
}
// Get channels and create checck boxes
function siteSelectEvent() {
  i = dataSelect.selectedIndex;
console.log(i)
  switch(i) {
  case 0:
    data = loadJSON('data-20200427.json', loadedJSON);
    break;
  case 1:
    data = loadJSON('data-20200507.json', loadedJSON);
    break;
      case 2:
    data = loadJSON('data-20200511.json', loadedJSON);
    break;
      case 3:
    data = loadJSON('data-20200513.json', loadedJSON);
    break;
  default:
    data = loadJSON('data-20200427.json', loadedJSON);
} 
}


// once JSON data has been loaded into document begin 
function loadedJSON() {
  let insuffcientData = [];
  dataRecorders = data.Data.DataRecorder;
  
  
  // create drop down HTML element
  sel = createSelect();
  sel.id('eltSel');
  sel.position(200, chartHeight + 10);


  // populate drop down list only with records containing suficient data
  dataRecorders.forEach((row) => {
    if (row.DataRecords != "") {
      if (Array.isArray(row.DataRecords.DR) && row.DataRecords.DR.length > 2) {
        
        // add option to drop down list
        sel.option(row.label);
        
        // else log record with insufficient data
      } else insuffcientData.push(row.label);
    } else insuffcientData.push(row.label);
  });
  console.log(insuffcientData);
  console.log(insuffcientData.length + " records with insufficient data");
  sel.changed(mySelectEvent);
  sel = document.getElementById("eltSel");
  // load chart with default data selection
  sel.value = "Hist mean Log"
  mySelectEvent();
  checkboxes[0].childNodes[0].checked = true;
  checkboxes[1].childNodes[0].checked = true;
  checkboxes[2].childNodes[0].checked = true;
  myCheckedEvent();
}

// Get channels and create checck boxes
function mySelectEvent() {
  let ckbxElementsLen = document.getElementsByClassName('ckbx').length;
  indxSelected = sel.selectedIndex;
  itemSelected = sel.options[indxSelected].value;
  dataRecord = dataRecorders.find(item => item.label == itemSelected);
  let channels = dataRecord.Channels.Channel;
  title = dataRecord.label;
  
  checkboxes = [];
  // if document already contains checkboxes, remove checkbox elements
  if (ckbxElementsLen) {
    var ckbxElements = document.getElementsByClassName('ckbx');
    for (i = ckbxElementsLen - 1; i >= 0; i--) {
      
      // remove checkbox element
      ckbxElements[i].remove();
    }
  }
  
  // add checkbox for each channel to the document
  channels.forEach((channel, index) => {
    checkboxes.push(createCheckbox(channels[index].label, false));
    checkboxes[index].position(350, chartHeight + 35 + (index * 15));
    checkboxes[index].id(index);
    checkboxes[index].class("ckbx");
    checkboxes[index].changed(myCheckedEvent);
    checkboxes[index] = document.getElementById(index)
  });
}


// get channel data to add to chart
function myCheckedEvent() {
  let labels = ["ts"];
  let rows = [];
  let dataRecordData = dataRecord.DataRecords.DR;
  let dataRecordChannels = dataRecord.Channels.Channel;

  end = dataRecordData.length;
  checkboxes.forEach((ckbx, index) => {
    if (ckbx.childNodes[0].checked) {
      labels.push(dataRecordChannels[index].label);
    }
  });

  for (i = start; i < end; i++) {
    let row = [];
    // add timestamp to first col
    row.push(new Date(dataRecordData[i].ts));

    // add only selected channel data to following cols
    checkboxes.forEach((ckbx, index) => {
      if (ckbx.childNodes[0].checked) {
        let obj = dataRecordData[i]
        // +2 because CH1 starts at index 2. Index 0 contains the POS and Index 1 the time stamp 
        row.push(float(Object.values(obj)[index + 2]));
      }
    });
    rows.push(row);
  }
  let highlight_start = new Date(dataRecordData[0].ts);
  let highlight_end = new Date(dataRecordData[0].ts);
  updateChart(rows, labels, highlight_start, highlight_end);
}


// Update chart with new data and format options
function updateChart(rows, labels, highlight_start, highlight_end, channels) {
  g3 = new Dygraph(document.getElementById("graphdiv2"),
    rows, {
      labels: labels,
      animatedZooms: false,
      underlayCallback: function(canvas, area, g) {
        var bottom_left = g.toDomCoords(highlight_start, -20);
        var top_right = g.toDomCoords(highlight_end, +20);
        var left = bottom_left[0];
        var right = top_right[0];
        canvas.fillStyle = "rgba(255, 255, 102, 1.0)";
        canvas.fillRect(left, area.y, right - left, area.h);
      },
      interactionModel: {
        'mousedown': downV3,
        'mousemove': moveV3,
        'mouseup': upV3,
        'click': clickV3,
        'dblclick': dblClickV3,
        'mousewheel': scrollV3
      },
      showRangeSelector: true,
      legend: 'always',
      title: title,
      titleHeight: 32,
      ylabel: 'yAxis',
      xlabel: 'Date (Ticks indicate the start of the indicated time period)',
      strokeWidth: 1.5,
      rightGap: 150
    });
}
