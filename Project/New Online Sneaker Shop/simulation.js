/*******************************************************
 Simulation Model
********************************************************/
sim.model.name = "Make-and-Deliver-Pizza-1";
sim.model.time = "continuous";
sim.model.timeUnit = "sec";

sim.model.objectTypes = ["RequestHandler","SizeHandler"];
sim.model.eventTypes = ["SneakerRequest"];
sim.model.activityTypes = ["HandleSneakerRequest","HandleSizeRequest","HandleCheckoutRequest"];


/*******************************************************
 Default Simulation Scenario
 ********************************************************/
sim.scenario.durationInSimTime = 3*60;
sim.scenario.title = "Default scenario.";
sim.scenario.description = "The default scenario has 4 request handlers, 6 size handlers, 10 size channels, and 15 checkout channels.";
sim.scenario.setupInitialState = function () {
  SneakerRequest.arrivalRates = [1/5, 1/7, 2/6]; // high number of request
  const rh1 = new RequestHandler({id: 1, name:"rh1", status: rESOURCEsTATUS.AVAILABLE}),
      rh2 = new RequestHandler({id: 2, name:"rh2", status: rESOURCEsTATUS.AVAILABLE}),
      rh3 = new RequestHandler({id: 3, name:"rh3", status: rESOURCEsTATUS.AVAILABLE}),
      rh4 = new RequestHandler({id: 4, name:"rh4", status: rESOURCEsTATUS.AVAILABLE}),
      pm1 = new SizeHandler({id: 11, name:"pm1", status: rESOURCEsTATUS.AVAILABLE}),
      pm2 = new SizeHandler({id: 12, name:"pm2", status: rESOURCEsTATUS.AVAILABLE}),
      pm3 = new SizeHandler({id: 13, name:"pm3", status: rESOURCEsTATUS.AVAILABLE}),
      pm4 = new SizeHandler({id: 14, name:"pm4", status: rESOURCEsTATUS.AVAILABLE}),
      pm5 = new SizeHandler({id: 15, name:"pm5", status: rESOURCEsTATUS.AVAILABLE}),
      pm6 = new SizeHandler({id: 16, name:"pm6", status: rESOURCEsTATUS.AVAILABLE});
  // Initialize the individual resource pools
  sim.scenario.resourcePools["requestHandlers"].availResources.push( rh1, rh2, rh3, rh4);
  sim.scenario.resourcePools["sizeHandlers"].availResources.push( pm1,pm2,pm3,pm4,pm5,pm6);
  // Initialize the count pools
  sim.scenario.resourcePools["size_channels"].size = 10;
  sim.scenario.resourcePools["checkout_channels"].available = 15;
}
/*******************************************************
 Alternative Scenarios
 ********************************************************/

sim.scenarios[1] = {
  scenarioNo: 1,
  title: "Model variant: same online shop architecture, higher request",
  description: `The number of available resource is the same as the default scenario, but in this
                case we have a highly requested sneakers and therefore more request`,
  setupInitialState: function () {
    SneakerRequest.arrivalRates = [1/0.7, 1/0.4, 1/0.6]; // high number of request
  const rh1 = new RequestHandler({id: 1, name:"rh1", status: rESOURCEsTATUS.AVAILABLE}),
      rh2 = new RequestHandler({id: 2, name:"rh2", status: rESOURCEsTATUS.AVAILABLE}),
      rh3 = new RequestHandler({id: 3, name:"rh3", status: rESOURCEsTATUS.AVAILABLE}),
      rh4 = new RequestHandler({id: 4, name:"rh4", status: rESOURCEsTATUS.AVAILABLE}),
      pm1 = new SizeHandler({id: 11, name:"pm1", status: rESOURCEsTATUS.AVAILABLE}),
      pm2 = new SizeHandler({id: 12, name:"pm2", status: rESOURCEsTATUS.AVAILABLE}),
      pm3 = new SizeHandler({id: 13, name:"pm3", status: rESOURCEsTATUS.AVAILABLE}),
      pm4 = new SizeHandler({id: 14, name:"pm4", status: rESOURCEsTATUS.AVAILABLE}),
      pm5 = new SizeHandler({id: 15, name:"pm5", status: rESOURCEsTATUS.AVAILABLE}),
      pm6 = new SizeHandler({id: 16, name:"pm6", status: rESOURCEsTATUS.AVAILABLE});
  // Initialize the individual resource pools
  sim.scenario.resourcePools["requestHandlers"].availResources.push( rh1, rh2, rh3, rh4);
  sim.scenario.resourcePools["sizeHandlers"].availResources.push( pm1,pm2,pm3,pm4,pm5,pm6);
  // Initialize the count pools
  sim.scenario.resourcePools["size_channels"].size = 10;
  sim.scenario.resourcePools["checkout_channels"].available = 15;
  }
};

sim.scenarios[2] = {
  scenarioNo: 2,
  title: "Model variant: improved online shop architecture, higher request",
  description: `As the shop owner saw how many request the site got during an hype release, he decided
                to increase the resource such as now the shop can handle 8 SneakersRequest, have 15 size channels and 20 checkout channels.`,
  setupInitialState: function () {
    SneakerRequest.arrivalRates = [1/0.2, 1/0.7, 2/0.4]; // high number of request
  const rh1 = new RequestHandler({id: 1, name:"rh1", status: rESOURCEsTATUS.AVAILABLE}),
      rh2 = new RequestHandler({id: 2, name:"rh2", status: rESOURCEsTATUS.AVAILABLE}),
      rh3 = new RequestHandler({id: 3, name:"rh3", status: rESOURCEsTATUS.AVAILABLE}),
      rh4 = new RequestHandler({id: 4, name:"rh4", status: rESOURCEsTATUS.AVAILABLE}),
      rh5 = new RequestHandler({id: 5, name:"rh5", status: rESOURCEsTATUS.AVAILABLE}),
      rh6 = new RequestHandler({id: 6, name:"rh6", status: rESOURCEsTATUS.AVAILABLE}),
      rh7 = new RequestHandler({id: 7, name:"rh7", status: rESOURCEsTATUS.AVAILABLE}),
      rh8 = new RequestHandler({id: 8, name:"rh8", status: rESOURCEsTATUS.AVAILABLE}),
      pm1 = new SizeHandler({id: 11, name:"pm1", status: rESOURCEsTATUS.AVAILABLE}),
      pm2 = new SizeHandler({id: 12, name:"pm2", status: rESOURCEsTATUS.AVAILABLE}),
      pm3 = new SizeHandler({id: 13, name:"pm3", status: rESOURCEsTATUS.AVAILABLE}),
      pm4 = new SizeHandler({id: 14, name:"pm4", status: rESOURCEsTATUS.AVAILABLE}),
      pm5 = new SizeHandler({id: 15, name:"pm5", status: rESOURCEsTATUS.AVAILABLE}),
      pm6 = new SizeHandler({id: 16, name:"pm6", status: rESOURCEsTATUS.AVAILABLE});
  // Initialize the individual resource pools
  sim.scenario.resourcePools["requestHandlers"].availResources.push( rh1, rh2, rh3, rh4, rh5, rh6, rh7, rh8);
  sim.scenario.resourcePools["sizeHandlers"].availResources.push( pm1,pm2,pm3,pm4,pm5,pm6);
  // Initialize the count pools
  sim.scenario.resourcePools["size_channels"].size = 15;
  sim.scenario.resourcePools["checkout_channels"].available = 20;
  }
};


/*******************************************************
 Statistics variables
********************************************************/
sim.model.setupStatistics = function () {
  sim.stat.completed_checkouts = 0;
  sim.stat.size_1 = 60;
  sim.stat.size_2 = 20;
  sim.stat.size_3 = 30;
  sim.stat.lost_orders_do_to_sizes_unavailable = 0;
};

