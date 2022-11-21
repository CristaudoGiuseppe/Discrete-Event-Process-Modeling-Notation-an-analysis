class HandleSizeRequest extends aCTIVITY {
  constructor({id, startTime, duration, node}={}) {
    super({id, startTime, duration, node});
  }
  static duration() {return rand.triangular(3,6,4);}

   
  onActivityEnd() {
    var size = Math.floor(Math.random() * 3);
    // implentazione con if perchè se no il sistema carica ogni volta in maniera statica le stat iniziali
    if (size == 0) {
      if(sim.stat.size_1 <= 0) {
        HandleSizeRequest.successorNode = "HandleSizeRequest";
        //sim.stat.lost_orders_do_to_sizes_unavailable++;
      } else {
        sim.stat.size_1--;
        HandleSizeRequest.successorNode = "HandleCheckoutRequest";
      }
    }

    if (size == 1) {
      if(sim.stat.size_2 <= 0) {
        HandleSizeRequest.successorNode = "HandleSizeRequest";
        //sim.stat.lost_orders_do_to_sizes_unavailable++;
      } else {
        sim.stat.size_2--;
        HandleSizeRequest.successorNode = "HandleCheckoutRequest";
      }
    }

    if (size == 2) {
      if(sim.stat.size_3 <= 0) {
        HandleSizeRequest.successorNode = "HandleSizeRequest";
       //sim.stat.lost_orders_do_to_sizes_unavailable++;
      } else {
        sim.stat.size_3--;
        HandleSizeRequest.successorNode = "HandleCheckoutRequest";
      }
    }
    if(sim.stat.size_1 <= 0 && sim.stat.size_2 <= 0 && sim.stat.size_3 <= 0) {
      sim.stat.lost_orders_do_to_sizes_unavailable++;
    }
    //console.log(HandleSizeRequest.successorNode);
    return []
  }
}

HandleSizeRequest.resourceRoles = {
  "sizeHandler": {range: SizeHandler, card: 2},
  "size_channel": {card: 1}
}


HandleSizeRequest.PERFORMER = ["sizeHandler"];
HandleSizeRequest.successorNode = "HandleCheckoutRequest";
