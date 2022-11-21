class HandleSneakerRequest extends aCTIVITY {
  constructor({id, startTime, duration, node}={}) {
    super({id, startTime, duration, node});
  }
  static duration() {
    return rand.uniform( 1, 4);  // durata dell'evento
  }

  static waitingTimeout() {
    return rand.uniformInt(10, 20); // dopo quanto tempo si stancano di stare in coda
  }
}
HandleSneakerRequest.resourceRoles = {
  "requestHandler": {range: RequestHandler}
}
HandleSneakerRequest.PERFORMER = ["requestHandler"];
HandleSneakerRequest.successorNode = "HandleSizeRequest";
