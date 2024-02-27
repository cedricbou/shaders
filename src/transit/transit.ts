export interface IEnergySource {
  consume(): void;
}

export interface IEnergyUsage {
  consume(): void;
}

export class SimplifiedCoalPowerPlant implements IEnergySource {
  constructor() {}
  consume() {}
}

export class SimplifiedWindmill implements IEnergySource {
  constructor() {}
  consume() {}
}

export class WindMillFactory {
  constructor() {}
  create() {}
}

export class SimpleEnergyGrid {
  constructor() {}
  connectSource(source: IEnergySource) {}
  connectUsage(usage: IEnergyUsage) {}
}

export class HumanUsages implements IEnergyUsage {
  constructor() {}
  consume() {}
}

export class WindmillSimulation {
  constructor(grid: SimpleEnergyGrid, windMillFactory: WindMillFactory) {}
  start() {}
  step() {}
  totalConsumption() {}
  totalPollution() {}
  totalWindMill() {}
}
