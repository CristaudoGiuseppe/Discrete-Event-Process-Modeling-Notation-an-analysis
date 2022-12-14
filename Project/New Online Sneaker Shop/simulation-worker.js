"use strict";
// load general framework code
self.importScripts("../lib/worker-library-files.js");
self.importScripts("../framework/core2-worker-oes.js");

// start simulation on message from main thread
onmessage = function (e) {
  var scenario={};
  function loadSimulationModelCode() {
    if (sim.model.otherCodeFiles) {
      for (const ocf of sim.model.otherCodeFiles) {
        self.importScripts( ocf + ".js");
      }
    }
    if (sim.model.objectTypes) {
      for (const objT of sim.model.objectTypes) {
        self.importScripts( objT + ".js");
      }
    }
    if (sim.model.eventTypes) {
      for (const evtT of sim.model.eventTypes) {
        self.importScripts( evtT + ".js");
      }
    }
    if (sim.model.activityTypes) {
      for (const actT of sim.model.activityTypes) {
        self.importScripts( actT + ".js");
      }
    }
    console.log("Simulation model code loaded.")
  }

  sim.loadEndTime = (new Date()).getTime();
  self.importScripts("simulation.js");
  // assign scenario parameters to model parameters
  if (e.data.scenParams) sim.model.p = e.data.scenParams;
  if (e.data.initialObjects) sim.scenario.initialObjects = e.data.initialObjects;
  loadSimulationModelCode();
  if (sim.experimentType) {  // when experimentType has been set, run it
    sim.runExperiment( sim.experimentType);
  } else if (e.data.simToRun >= 0) {
    // assign alternative scenario, if selected
    if (e.data.scenarioNo !== undefined && sim.scenarios[e.data.scenarioNo]) {
      scenario = sim.scenarios[e.data.scenarioNo];
      if (e.data.scenParams) scenario.parameters = e.data.scenParams;
      // copy simulation end time from base scenario if not provided
      if (!scenario.durationInSimTime && !scenario.durationInSimSteps && !scenario.durationInCpuTime) {
        if (sim.scenario.durationInSimTime) {
          scenario.durationInSimTime = sim.scenario.durationInSimTime;
        } else if (sim.scenario.durationInSimSteps) {
          scenario.durationInSimSteps = sim.scenario.durationInSimSteps;
        } else if (sim.scenario.durationInCpuTime) {
          scenario.durationInCpuTime = sim.scenario.durationInCpuTime;
        }
      }
      // copy initialObjects provided by UI
      if (sim.scenario.initialObjects) scenario.initialObjects = sim.scenario.initialObjects;
      // copy setupInitialState from base scenario if not provided
      if (!scenario.setupInitialState) scenario.setupInitialState = sim.scenario.setupInitialState;
      sim.scenario = scenario;
    }
    if (e.data.simToRun === 0) {
      sim.runStandaloneScenario( e.data.createLog);
    } else {
      let expNo = e.data.simToRun - 1;
      sim.experimentType = sim.experimentTypes[expNo];
      sim.experimentType.storeExpResults = e.data.storeExpRes;
      sim.runExperiment();
    }
  }
};