class SneakerRequest extends eVENT {
  constructor({occTime, delay}={}) {
    super({occTime, delay});
  }

  createNextEvent() {
    return new SneakerRequest({delay: SneakerRequest.recurrence()});
  }

  static recurrence() {
    var cent = Math.floor(sim.time / 60);
    return rand.exponential(SneakerRequest.arrivalRates[cent]);
  }
}

//SneakerRequest.arrivalRates = [1/0.2, 1/0.7, 2/0.4]; // generare random in base al numero di minuti
SneakerRequest.successorNode = "HandleSneakerRequest";
//SneakerRequest.eventRate = 0.5;
