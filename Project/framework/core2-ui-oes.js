/**********************************************************************
 *** Create UI namespace objects **************************************
 **********************************************************************/
oes.ui = Object.create(null);
oes.ui.obs = Object.create(null);
oes.ui.obs.SVG = Object.create(null);

var numberOfLostCheckout = 0;
var avgQueueLength = 0;

oes.ui.nodeStat = {
  enqu: {title:"enqueued tasks"},
  LostCheckouts: {title:"Number of lost order due to queue"},
  start: {title:"started activities"},
  compl: {title:"completed/preempted activities"},
  qLen: {title:"maximum queue length"},
  AVGLen: {title:"average queue length"},
  wTime: {title:"average/maximum waiting time"},
  cTime: {title:"average/maximum cycle time"}
};
// for being able to run setupInitialStateForUi
class oBJECT {
  constructor( id, name) {
    this.id = id || sim.idCounter++;
    // add each new object to the Map of simulation objects by ID
    if (name) {  // name is optional
      this.name = name;
    }
  }
}
/*******************************************************
 UI for modifying model parameter values
 *******************************************************/
oes.ui.createModelParameterPanel = function () {
  const uiPanelEl = util.createExpandablePanel({id:"ModelParameterUI",
    heading: "Model Parameters", borderColor:"aqua",
    hint: "Modify model parameter values"
  });
  return uiPanelEl;
};
/*******************************************************
 UI for defining the initial state objects
 *******************************************************/
oes.ui.createInitialObjectsPanel = function () {
  const uiPanelEl = util.createExpandablePanel({id:"InitialStateObjectsUI",
    heading: "Initial Objects", borderColor:"aqua",
    hint: "Delete, create or edit the objects of the initial state"
  });
  return uiPanelEl;
};
/*******************************************************
 Create a simulation log entry (table row)
 ********************************************************/
oes.ui.logSimulationStep = function (simLogTableEl, step, time, currEvtsStr, objectsStr, futEvtsStr) {
  const decPl = oes.defaults.simLogDecimalPlaces,
        rowEl = simLogTableEl.insertRow();  // create new table row
  rowEl.insertCell().textContent = String( step);
  rowEl.insertCell().textContent = String( math.round( time, decPl));
  rowEl.insertCell().innerHTML = currEvtsStr.split("|").map( str => str.substring(0, str.indexOf("@"))).join(", ");
  rowEl.insertCell().textContent = objectsStr.split("|").join(", ");
  rowEl.insertCell().innerHTML = futEvtsStr;
}
/*******************************************************
 Display the standalone scenario run statistics
 ********************************************************/
oes.ui.showStatistics = function (stat) {
  const decPl = oes.defaults.expostStatDecimalPlaces;
  const showTimeSeries = "timeSeries" in stat;
  var isAN=false, isPN=false, nmrOfPredefStatSlots=0;

  function createActyNodeStatTableHead()  {
    const nodeStat = oes.ui.nodeStat;
    var perNodeStatHeading="";
    if (!stat.includeTimeouts) delete nodeStat.tmout;
    for (const nodeStatShortLabel of Object.keys( nodeStat)) {
      perNodeStatHeading +=
          `<th title="${nodeStat[nodeStatShortLabel].title}">${nodeStatShortLabel}</th>`;
    }
    return perNodeStatHeading;
  }
  const perNodeStatTblHeadElemsString = createActyNodeStatTableHead();

  function isEntryNodeStat( nodeStat) {
    return "nmrOfArrivedObjects" in nodeStat;
  }
  function isExitNodeStat( nodeStat) {
    return "nmrOfDepartedObjects" in nodeStat;
  }

  if (typeof stat.networkNodes === "object" && Object.keys( stat.networkNodes).length > 0) {
    if (Object.keys(stat.networkNodes).some(
        nodeName => isEntryNodeStat( stat.networkNodes[nodeName]))) {
      isPN = true;
    } else {
      isAN = true;
    }
    nmrOfPredefStatSlots = "includeTimeouts" in stat ? 2 : 1;
  }
  if ("table" in stat) nmrOfPredefStatSlots++;
  if (showTimeSeries) nmrOfPredefStatSlots++;
  // create two column table for user-defined statistics
  if (Object.keys( stat).length > nmrOfPredefStatSlots) {
    const usrStatTblElem = document.createElement("table"),
          tbodyEl = usrStatTblElem.createTBody(),
          captionEl = usrStatTblElem.createCaption();
    usrStatTblElem.id = "userDefinedStatisticsTbl";
    captionEl.textContent = "User-defined statistics";
    for (const varName of Object.keys( stat)) {
      // skip pre-defined statistics (collection) variables
      if (["table","networkNodes","resUtil","includeTimeouts","timeSeries"].includes( varName)) continue;
      const rowEl = tbodyEl.insertRow();  // create new table row
      rowEl.insertCell().textContent = varName;
      rowEl.insertCell().textContent = math.round( stat[varName], decPl);
    }
    document.getElementById("simInfo").insertAdjacentElement(
        "afterend", usrStatTblElem);
  }
  // create table filled with object attribute values
  if ("table" in stat) {
    const objTblElem = document.createElement("table"),
          tbodyEl = objTblElem.createTBody(),
          captionEl = objTblElem.createCaption();
    objTblElem.id = "objectsStatisticsTbl";
    captionEl.textContent = stat.table.name || "Object statistics";
    for (const row of stat.table.rows) {
      const rowEl = tbodyEl.insertRow();  // create new table row
      for (const cell of row) {
        if (cell === row[0]) {  // row heading
          rowEl.insertCell().textContent = cell;
        } else {
          if (row === stat.table.rows[0]) {  // column headings
            rowEl.insertCell().textContent = cell;
          } else {
            rowEl.insertCell().textContent = math.round( cell, decPl);
          }
        }
      }
    }
    document.getElementById("simInfo").insertAdjacentElement(
        "afterend", objTblElem);
  }
  if (isAN || isPN) {
    if (isPN) {
      // create table for PN statistics per entry node
      const entryNodeStatTblElem = document.createElement("table"),
            tbodyEl = entryNodeStatTblElem.createTBody(),
            rowEl = tbodyEl.insertRow();
      entryNodeStatTblElem.id = "entryNodeStatisticsTbl";
      rowEl.innerHTML = "<tr><th>Entry node</th><th>arrived</th></tr>";
      for (const nodeName of Object.keys( stat.networkNodes)) {
        const nodeStat = stat.networkNodes[nodeName];
        if (isEntryNodeStat( nodeStat)) {
          const rowEl = tbodyEl.insertRow();
          rowEl.insertCell().textContent = nodeName;
          rowEl.insertCell().textContent = nodeStat.nmrOfArrivedObjects;
        }
      }
      document.getElementById("execInfo").insertAdjacentElement("beforebegin", entryNodeStatTblElem);
    }

    // create table for AN/PN statistics per activity/processing node
    const actyNodeStatTblElem = document.createElement("table");
    const tbodyEl = actyNodeStatTblElem.createTBody();
    actyNodeStatTblElem.id = "activityNodeStatisticsTbl";
    tbodyEl.insertRow().innerHTML = `<tr><th>${isPN ? "Processing":"Activity"} node</th>`+
        perNodeStatTblHeadElemsString + "<th>resource utilization</th></tr>";
    var nodeStatCounter = 1;
    for (const nodeName of Object.keys( stat.networkNodes)) {
      const nodeStat = stat.networkNodes[nodeName];
      if ("resUtil" in nodeStat) {
        const rowEl = tbodyEl.insertRow();
        rowEl.insertCell().textContent = nodeName;
        rowEl.insertCell().textContent = nodeStat.enqueuedActivities;
        if (stat.includeTimeouts) {
          rowEl.insertCell().textContent = nodeStat.waitingTimeouts;
        }
        rowEl.insertCell().textContent = nodeStat.startedActivities;
        rowEl.insertCell().textContent = nodeStat.preemptedActivities ?
            nodeStat.completedActivities +"/"+ nodeStat.preemptedActivities : nodeStat.completedActivities;
        rowEl.insertCell().textContent = nodeStat.queueLength.max;
        avgQueueLength += nodeStat.queueLength.max;
        rowEl.insertCell().textContent = Math.round(avgQueueLength/nodeStatCounter * 100) / 100;
        nodeStatCounter += 1;
        rowEl.insertCell().textContent = math.round( nodeStat.waitingTime.avg, decPl) +"/"+
            math.round( nodeStat.waitingTime.max, decPl);
        rowEl.insertCell().textContent = math.round( nodeStat.cycleTime.avg, decPl) +"/"+
            math.round( nodeStat.cycleTime.max, decPl);
        rowEl.insertCell().textContent = JSON.stringify( nodeStat.resUtil);
      }
      console.log(nodeStat);
    }
    document.getElementById("execInfo").insertAdjacentElement("beforebegin", actyNodeStatTblElem);
    if (isPN) {
      // create table for PN statistics per exit node
      const exitNodeStatTblElem = document.createElement("table");
      const tbodyEl = exitNodeStatTblElem.createTBody();
      exitNodeStatTblElem.id = "exitNodeStatisticsTbl";
      const rowEl = tbodyEl.insertRow();
      rowEl.innerHTML = "<tr><th>Exit node</th><th>departed</th><th>avg. throughput time</th></tr>";
      for (const nodeName of Object.keys( stat.networkNodes)) {
        const nodeStat = stat.networkNodes[nodeName];
        if (isExitNodeStat( nodeStat)) {
          const rowEl = tbodyEl.insertRow();
          rowEl.insertCell().textContent = nodeName;
          rowEl.insertCell().textContent = nodeStat.nmrOfDepartedObjects;
          rowEl.insertCell().textContent = nodeStat.throughputTime;
        }
      }
      document.getElementById("execInfo").insertAdjacentElement("beforebegin", exitNodeStatTblElem);
    }
  }
  if (showTimeSeries) {
    const timeSeriesChartContainerEl = document.createElement("div");
    timeSeriesChartContainerEl.id = "time-series-chart";
    document.getElementById("simInfo").insertAdjacentElement(
        "afterend", timeSeriesChartContainerEl);
    const timeSeriesLabels = Object.keys( stat.timeSeries),
          firstTmSerLbl = timeSeriesLabels[0],
          firstTmSer = stat.timeSeries[firstTmSerLbl];
    const legendLabels=[], chartSeries=[];
    let dataT = [];
    if (Array.isArray( firstTmSer[0])) {  // next-event time progression
      dataT = firstTmSer[0];  // time series timepoints
    } else {  // fixed-increment time progression
      for (let i=0; i < firstTmSer.length; i++) {
        dataT.push(i * sim.timeIncrement);
      }
    }
    for (const tmSerLbl of timeSeriesLabels) {
      legendLabels.push( tmSerLbl);
      if (sim.timeIncrement) {  // fixed-increment time progression
        dataY = stat.timeSeries[tmSerLbl];
      } else {  // next-event time progression
        dataY = stat.timeSeries[tmSerLbl][1];
      }
      chartSeries.push({name: tmSerLbl, data: dataY});
    }
    const chart = new Chartist.Line("#time-series-chart", {
          labels: dataT,
          series: chartSeries
        }, {
          showPoint: false,
          lineSmooth: true,
          width: "90%", height: "400px",
          axisX: {
            labelInterpolationFnc: function ( value, index ) {
              const interval = parseInt( dataT.length / 10 );
              return index % interval === 0 ? value : null;
            }
          },
          axisY: {
            //offset: 60,
            /*
            labelInterpolationFnc: function ( value ) {
              return value.toFixed( 2 );
            }
            */
          },
          plugins: [
            // display chart legend
            Chartist.plugins.legend({
              legendNames: legendLabels
            })
          ]}
    );
  }
}
/*********************************************************************
 Show the results of a simple experiment
 **********************************************************************/
oes.ui.showSimpleExpResults = function (exp) {
  const nmrOfRepl = exp.nmrOfReplications,
        decPl = oes.defaults.expostStatDecimalPlaces;
  const tableEl = document.createElement("table"),
        tbodyEl = document.createElement("tbody");
  tableEl.id = "statisticsTbl";
  tableEl.innerHTML = '<caption>Experiment results</caption>';
  tableEl.appendChild( tbodyEl);

  function createSimpleExpResultsTableHead()  {
    // number of user-defined statistics
    const M = Object.keys( exp.replicStat).length - 1,  // deduct "networkNodes"
          // number of activity types
          N = Object.keys( exp.replicStat.networkNodes).length,
          nodeStat = oes.ui.nodeStat,
          actStatWithoutTmout = {...nodeStat};
    var colHeadingsRow="", usrDefStatVarHeads="", actTypeHeads="", nmrOfTmoutStat=0,
        perActyStatHeading="", perActyStatHeadingWithoutTmout="", perActyStatHeads = "",
        NAS = Object.keys( nodeStat).length - 1;  // number of activity statistics without tmout
    // drop tmout entry
    delete actStatWithoutTmout.tmout;
    // create heading for activity type with tmout
    for (let actStatShortLabel of Object.keys( nodeStat)) {
      perActyStatHeading +=
          `<th title="${nodeStat[actStatShortLabel].title}">${actStatShortLabel}</th>`;
    }
    // create heading for activity type without tmout
    for (let actStatShortLabel of Object.keys( actStatWithoutTmout)) {
      perActyStatHeadingWithoutTmout +=
          `<th title="${nodeStat[actStatShortLabel].title}">${actStatShortLabel}</th>`;
    }
    for (const nodeName of Object.keys( exp.replicStat.networkNodes)) {
      const replActStat = exp.replicStat.networkNodes[nodeName];
      perActyStatHeads += replActStat.waitingTimeouts ?
          perActyStatHeading : perActyStatHeadingWithoutTmout;
      if (replActStat.waitingTimeouts) nmrOfTmoutStat++;
    }
    for (const key of Object.keys( exp.replicStat)) {
      const thStartTag = N>0 ? "<th rowspan='2'>" : "<th>";
      usrDefStatVarHeads += key !== "networkNodes" ? thStartTag + key +"</th>" : "";
    }
    actTypeHeads = Object.keys( exp.replicStat.networkNodes).reduce( function (prev, nodeName) {
      const n = exp.replicStat.networkNodes[nodeName].waitingTimeouts ? NAS+1 : NAS;
      return prev + `<th colspan='${n}'>${nodeName}</th>`;
    },"");
    colHeadingsRow = `<tr><th rowspan='${2 + (N>0?1:0)}'>Replication</th>`;
    colHeadingsRow += M > 0 ? `<th colspan='${M}'>User-Def. Statistics</th>`:"";
    colHeadingsRow += N > 0 ? `<th colspan='${N*NAS+nmrOfTmoutStat}'>Statistics per activity type</th>`:"";
    colHeadingsRow += "</tr>";
    let theadEl = tableEl.createTHead();
    theadEl.innerHTML = colHeadingsRow +
        "<tr>"+ usrDefStatVarHeads + actTypeHeads +"</tr>" +
        "<tr>"+ perActyStatHeads +"</tr>";
    tableEl.style.overflowX = "auto";  // horizontal scrolling
  }
  createSimpleExpResultsTableHead();
  for (let i=0; i < nmrOfRepl; i++) {
    const rowEl = tbodyEl.insertRow();  // create new table row
    rowEl.insertCell().textContent = String(i+1);  // replication No
    for (const varName of Object.keys( exp.replicStat)) {
      if (varName !== "networkNodes") {  // key is a user-defined statistics variable name
        const val = exp.replicStat[varName][i];
        rowEl.insertCell().textContent = math.round( val, decPl);
      }
    }
    for (const nodeName of Object.keys( exp.replicStat.networkNodes)) {
      const replActStat = exp.replicStat.networkNodes[nodeName];
      rowEl.insertCell().textContent = replActStat["enqueuedActivities"][i];
      if (replActStat["waitingTimeouts"]) {
        rowEl.insertCell().textContent = replActStat["waitingTimeouts"][i];
      }
      rowEl.insertCell().textContent = replActStat["startedActivities"][i];
      rowEl.insertCell().textContent = replActStat["completedActivities"][i];
      for (const statVarName of ["queueLength","waitingTime","cycleTime"]) {
        const val = replActStat[statVarName].max[i];
        rowEl.insertCell().textContent = Number.isInteger(val) ? val : math.round( val, decPl);
      }
      /*****TODO: support also the following statistics *****/
      //nodeStat.resUtil = {};
    }
  }
  // create footer with summary statistics
  for (const aggr of Object.keys( math.stat.summary)) {
    rowEl = tbodyEl.insertRow();  // create new table row
    rowEl.insertCell().textContent = math.stat.summary[aggr].label;
    for (const varName of Object.keys( exp.summaryStat)) {
      if (varName !== "networkNodes") {  // varName is a user-defined statistics variable name
        const val = exp.summaryStat[varName][aggr];
        rowEl.insertCell().textContent = math.round( val, decPl);
      }
    }
    for (const nodeName of Object.keys( exp.summaryStat.networkNodes)) {
      const sumActStat = exp.summaryStat.networkNodes[nodeName];
      for (const statVarName of Object.keys( sumActStat)) {
        const val = sumActStat[statVarName][aggr];
        rowEl.insertCell().textContent = math.round( val, decPl);
      }
      /*****TODO: support also the following statistics *****/
      //nodeStat.resUtil = {};
    }
  }
  document.getElementById("simInfo").insertAdjacentElement( "afterend", tableEl);
}
/*********************************************************************
 Create the table head for parameter variation experiment results
 **********************************************************************/
oes.ui.createParVarExpResultsTableHead = function (stat, tableEl)  {
  var N = Object.keys( stat).length, statVarHeadings="", colHeadingsRow="";
  let theadEl = tableEl.createTHead();
  Object.keys( stat).forEach( function (v) {
    statVarHeadings += "<th>"+ v +"</th>";
  })
  colHeadingsRow = `<tr><th rowspan='2'>Experiment scenario</th><th rowspan='2'>Parameter values</th><th colspan='${N}'>Statistics</th></tr>`;
  theadEl.innerHTML = colHeadingsRow + "<tr>"+ statVarHeadings +"</tr>";
  tableEl.style.overflowX = "auto";  // horizontal scrolling
}
/*********************************************************************
 Show the results of a parameter variation experiment
 **********************************************************************/
oes.ui.showResultsFromParVarExpScenarioRun = function (data, tableEl) {
  var tbodyEl = tableEl.tBodies[0];
  var rowEl = tbodyEl.insertRow();  // create new table row
  rowEl.insertCell().textContent = data.expScenNo;
  rowEl.insertCell().textContent = data.expScenParamValues.toString();
  Object.keys( data.expScenStat).forEach( function (v) {
    var statVal = data.expScenStat[v], displayStr="",
        decPl = oes.defaults.expostStatDecimalPlaces;
    displayStr = math.round( statVal, decPl);
    rowEl.insertCell().textContent = displayStr;
  });
}

// Assign variables for accessing UI elements
const formEl = document.forms["run"],
    selScenEl = formEl["selScen"],
    logCheckboxEl = formEl["log"],
    storeExpResCheckboxEl = formEl["storeExpRes"],
    selExpEl = formEl["selExp"],
    modelDescriptionEl = document.getElementById("modelDescription"),
    scenarioTitleEl = document.getElementById("scenarioTitle"),
    scenarioDescriptionEl = document.getElementById("scenarioDescription"),
    upfrontUiEl = document.getElementById("upfrontUI"),
    simLogTableEl = document.getElementById("simLog"),
    statisticsTableEl = document.getElementById("statisticsTbl"),
    simInfoEl = document.getElementById("simInfo"),
    execInfoEl = document.getElementById("execInfo");
    timeoutInfoEl = document.getElementById("lostOrderInfo");
    avgQueueLengthInfoEl = document.getElementById("avgQueueLengthInfo");
// initialize the className->Class map
sim.Classes = Object.create(null);

function setupUI() {
  var optionTextItems = [];
  function renderInitialObjectsTables() {
    const containerEl = oes.ui.createInitialObjectsPanel(),
        objTypeTableElems = containerEl.querySelectorAll("table.EntityTableWidget");
    document.getElementById("upfrontUI").appendChild( containerEl);
    for (const objTypeTableEl of objTypeTableElems) {
      objTypeTableEl.remove();
    }
    for (const objTypeName of sim.ui.objectTypes) {
      const OT = sim.Classes[objTypeName];
      let entityTblWidget=null;
      if (!OT || OT.isAbstract) continue;
      try {
        entityTblWidget = new EntityTableWidget( OT);
      } catch (e) {
        console.error( e);
      }
      if (entityTblWidget) containerEl.appendChild( entityTblWidget);
    }
  }
  // fill scenario choice control
  if (sim.scenarios.length > 0) {
    for (const scen of sim.scenarios) {
      optionTextItems.push( scen.title);
    }
    util.fillSelectWithOptionsFromStringList( selScenEl, optionTextItems);
  }
  // fill run selection list
  optionTextItems = ["Standalone simulation"];
  if (sim.experimentTypes.length > 0) {
    for (const expT of sim.experimentTypes) {
      optionTextItems.push( expT.title);
    }
    util.fillSelectWithOptionsFromStringList( selExpEl, optionTextItems);
  }
  if (sim.config.ui.modelParameters && Object.keys( sim.model.p).length > 0 && upfrontUiEl) {  // create model parameter panel
    sim.scenario.parameters = {...sim.model.p};  // clone model parameters
    document.getElementById("upfrontUI").appendChild( oes.ui.createModelParameterPanel());
    fillModelParameterPanel( sim.scenario.parameters);
  }
  // create initial state UI
  if (Array.isArray( sim.ui.objectTypes) && sim.ui.objectTypes.length > 0) {
    if ("setupInitialStateForUi" in sim.scenario) {
      sim.scenario.setupInitialStateForUi();
    }
    renderInitialObjectsTables();
  }
}
function fillModelParameterPanel( record) {
  const containerEl = document.getElementById("ModelParameterUI"),
        modParTableEl = containerEl?.querySelector("table.SingleRecordTableWidget");
  // drop the <table> child element
  if (modParTableEl) modParTableEl.remove();
  if (containerEl) containerEl.appendChild( new SingleRecordTableWidget( record));
}
function onChangeOfScenSelect() {
  const scenarioNo = parseInt( selScenEl.value);
  sim.scenario = sim.scenarios[scenarioNo];
  scenarioTitleEl.textContent = sim.scenario.title;
  scenarioDescriptionEl.innerHTML = sim.scenario.description;
  if (scenarioNo > 0) {
    const changedParams = Object.keys( sim.scenario.parameters || {});
    // fill up scenario parameters
    for (const paramName of Object.keys( sim.model.p)) {
      if (!changedParams.includes( paramName)) {
        sim.scenario.parameters[paramName] = sim.model.p[paramName];
      }
    }
  } else {  // default scenario
    sim.scenario.parameters = {...sim.model.p};  // clone model parameters
  }
  fillModelParameterPanel( sim.scenario.parameters);
}
function onChangeOfExpSelect() {
  if (selExpEl.value === "0") {
    logCheckboxEl.parentElement.style.display = "block";
    storeExpResCheckboxEl.parentElement.parentElement.style.display = "none";
  } else {
    logCheckboxEl.parentElement.style.display = "none";
    // allow choosing "store results" only if browser supports IndexedDB
    if ('indexedDB' in self) {
      storeExpResCheckboxEl.parentElement.parentElement.style.display = "block";
    }
  }
}
async function exportExperResults() {
  var text=""
  // set default export separator
  const exportSep = sim.config?.exportSep || ";";
  // establish DB connection
  if (!sim.db) {
    try {
      sim.db = await idb.openDB( sim.model.name, 1, {
        upgrade(db) {
          db.createObjectStore( "experiment_runs", {keyPath: "id", autoIncrement: true});
          db.createObjectStore( "experiment_scenarios", {keyPath: "id", autoIncrement: true});
          db.createObjectStore( "experiment_scenario_runs", {keyPath: "id", autoIncrement: true});
        }
      });
    } catch( err) {
      console.log("IndexedDB error: ", err.message);
    }
  }
  if (!sim.db.objectStoreNames.contains("experiment_runs")) {
    execInfoEl.textContent = "There are no experiment records!";
    return;
  }
  const experRunRecords = await sim.db.getAll("experiment_runs");
  if (experRunRecords.length === 0) {
    execInfoEl.textContent = "There are no experiment records!";
    return;
  }
  // Export data about experiment_runs
  text = ["id","experimentType","baseScenarioNo","dateTime","parameters"].join( exportSep) + "\n";
  for (const rec of experRunRecords) {
    let row=[];  // Definitions
    let simExper = sim.experimentTypes[rec.experimentType];
    row.push( rec.id);
    row.push( rec.experimentType);
    row.push( rec.baseScenarioNo);
    row.push( rec.dateTime);
    if (simExper.parameterDefs) {
      let parNames = simExper.parameterDefs.map( defRec => defRec.name);
      row.push( parNames.join("/"));
    }
    text += row.join( exportSep) + "\n";
  }
  util.generateTextFile( "experiment_runs", text);
  // Export data about experiment_scenarios
  const experScenRecords = await sim.db.getAll("experiment_scenarios");
  if (experScenRecords.length === 0) {
    console.log("There are no 'experiment_scenarios' records!");
  } else {
    text = ["id","experimentRun","experimentScenarioNo","parameterValueCombination"].join( exportSep) + "\n";
    for (const rec of experScenRecords) {
      let row=[];  // Definitions
      let parValues = rec.parameterValueCombination;
      row.push( rec.id);
      row.push( rec.experimentRun);
      row.push( rec.experimentScenarioNo);
      row.push( parValues.join("/"));
      text += row.join( exportSep) + "\n";
    }
    util.generateTextFile( "experiment_scenarios", text);
  }
  // Export data about experiment_scenario_runs
  const experScenRunRecords = await sim.db.getAll("experiment_scenario_runs");
  if (experScenRunRecords.length === 0) {
    console.log("There are no 'experiment_scenario_runs' records!");
  } else {
    text = ["id","experimentRun","experimentScenarioNo"].
        concat( Object.keys(experScenRunRecords[0].outputStatistics)).join( exportSep) + "\n";
    for (const rec of experScenRunRecords) {
      let row=[];  // Definitions
      row.push( rec.id);
      row.push( rec.experimentRun);
      row.push( rec.experimentScenarioNo);
      row.push( ...Object.values(rec.outputStatistics));
      text += row.join( exportSep) + "\n";
    }
    util.generateTextFile( "experiment_scenario_runs", text);
  }
}
async function clearDatabase() {
  await idb.deleteDB( sim.model.name);
}
/**************************************************************/
function run() {
  var choice = parseInt( selExpEl.value), data={}, initialObjects={};
  if (isNaN( choice)) choice = 0;
  if (choice > 0) {
    if (!sim.experimentType) sim.experimentType = sim.experimentTypes[parseInt(choice)-1];
    simInfoEl.textContent = sim.experimentType.title;
    statisticsTableEl.querySelector("caption").textContent = "Experiment Results";
  } else {
    simInfoEl.textContent = `Standalone scenario run with a simulation time/duration of ${sim.scenario.durationInSimTime} ${sim.model.timeUnit}.`;
    if (Object.keys( sim.stat).length > 0 && statisticsTableEl) statisticsTableEl.querySelector("caption").textContent = "Statistics";
  }
  // Hide UI elements
  if (document.getElementsByTagName("figure")[0]) {
    document.getElementsByTagName("figure")[0].style.display = "none";
  }
  if (modelDescriptionEl) modelDescriptionEl.style.display = "none";
  if (scenarioDescriptionEl) scenarioDescriptionEl.style.display = "none";
  if (upfrontUiEl) upfrontUiEl.style.display = "none";
  else formEl.style.display = "none";  // hide select&run form

  let nmrOfScriptFilesToLoad = 3; // lib + framework + simulation.js
  if (Array.isArray(sim.model.objectTypes)) nmrOfScriptFilesToLoad += sim.model.objectTypes.length;
  if (Array.isArray(sim.model.eventTypes)) nmrOfScriptFilesToLoad += sim.model.eventTypes.length;
  if (Array.isArray(sim.model.activityTypes)) nmrOfScriptFilesToLoad += sim.model.activityTypes.length;
  if (Array.isArray(sim.model.agentTypes)) nmrOfScriptFilesToLoad += sim.model.agentTypes.length;
  document.body.appendChild( util.createProgressBarEl(
      `Loading ${nmrOfScriptFilesToLoad} script files ...`));

  data = {simToRun: choice,  // either standalone sim or experiment
          scenParams: sim.scenario.parameters,
          createLog: logCheckboxEl.checked,
          storeExpRes: storeExpResCheckboxEl.checked};
  for (const objTypeName of Object.keys( sim.Classes)) {
    initialObjects[objTypeName] = sim.Classes[objTypeName].instances;
  }
  if (Object.keys( initialObjects).length > 0) data.initialObjects = initialObjects;
  if (sim.scenarios.length > 0) {
    data.scenarioNo = parseInt( selScenEl.value)
  }

  // store start time of simulation/experiment run
  const startWorkerTime = (new Date()).getTime();
  // set up the simulation worker
  const worker = new Worker("simulation-worker.js");
  // start the simulation in the worker thread
  worker.postMessage( data);
  // on incoming messages from worker
  worker.onmessage = function (e) {
    if (e.data.step !== undefined) {  // create simulation log entry
      simLogTableEl.parentElement.style.display = "block";
      oes.ui.logSimulationStep( simLogTableEl, e.data.step, e.data.time,
          e.data.currEvtsStr, e.data.objectsStr, e.data.futEvtsStr);
    } else {
      if (document.getElementById("progress-container")) {
        document.getElementById("progress-container").remove();
      }
      if (e.data.expScenNo !== undefined) {  // parameter variation experiment
        oes.ui.showResultsFromParVarExpScenarioRun( e.data, statisticsTableEl);
      } else { // standalone simulation run or simple experiment
        const loadTime = e.data.loadEndTime - startWorkerTime,
              executionTime = (new Date()).getTime() - e.data.loadEndTime;
        // Show loading time and execution time
        execInfoEl.textContent = `Script files loading time: ${loadTime} ms, simulation execution time: ${executionTime} ms. Reload the page [Ctrl-R] to start over.`;
        if (e.data.statistics) {  // statistics from standalone simulation run
          let duration = "";
          if (sim.scenario.durationInSimTime) duration = `${sim.scenario.durationInSimTime} ${sim.model.timeUnit}`;
          else duration = `${Math.ceil( e.data.endSimTime)} ${sim.model.timeUnit}`;
          simInfoEl.textContent = `Standalone simulation run with a simulation time/duration of ${duration}.`;
          oes.ui.showStatistics( e.data.statistics);
        } else if (e.data.simpleExperiment) {
          oes.ui.showSimpleExpResults( e.data.simpleExperiment);
        }
      }
    }
  }
}

/**************************************************************/
if ("timeSeries" in sim.model &&
    Object.keys( sim.model.timeSeries).length > 0 &&
    typeof Chartist === "undefined") {
  util.loadScript( "../lib/ui/chartist.js");
  util.loadCSS( "../css/chartist.css");
}
if (sim.scenarios.length > 0) {
  // Assign scenarioNo = 0 to default scenario
  sim.scenario.scenarioNo ??= 0;
  sim.scenario.title ??= "Default Scenario";
  // Assign sim.scenarios[0] if not defined
  if (!sim.scenarios[0]) sim.scenarios[0] = sim.scenario;
} else {
  selScenEl.parentElement.style.display = "none";
  selExpEl.style.display = "none";
}
if (sim.experimentType) run();  // pre-set experiment (in simulation.js)
else if (sim.ui?.objectTypes) {
  /*************************************************
   Load object classes for the initial objects UI
   *************************************************/
  let loadExpressions=[];
  for (const objTypeName of sim.ui.objectTypes) {
    loadExpressions.push( util.loadScript( objTypeName + ".js"));
  }
  Promise.all( loadExpressions).then( function () {
    for (const objTypeName of sim.ui.objectTypes)  {
      const OT = sim.Classes[objTypeName] = util.getClass( objTypeName);
      OT.instances = {};
    }
    setupUI();
  }).catch( function (error) {console.log( error);});
} else {
  setupUI();
}