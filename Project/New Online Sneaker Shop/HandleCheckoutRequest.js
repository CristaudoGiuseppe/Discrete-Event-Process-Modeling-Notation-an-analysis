class HandleCheckoutRequest extends aCTIVITY {
  constructor({id, startTime, duration, node}={}) {
    super({id, startTime, duration, node});
  }
  onActivityEnd() {
    sim.stat.completed_checkouts++;
    return []
  }
  static duration() {
    return rand.triangular(10, 30, 15);
  }
}

HandleCheckoutRequest.resourceRoles = {
  "checkout_channel": {card: 1}
}
HandleCheckoutRequest.PERFORMER = ["checkout_channel"];
