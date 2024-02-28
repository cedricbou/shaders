export interface IEnergySource {
  connectUsage(usage: IEnergyUsage): void;
  measure(elapsedTime: number): void;

  getConsumption(): number;
  getPollution(pollution: Pollutions): number;
  getLifespan(): number;
}

export interface IEnergyUsage {
  expectedConsumption(elapsedTime: number): number;
}

export interface IEnergySourceFactory {
  build(): IEnergySource;
}

export enum Pollutions {
  CO2 = 'CO2',
}

export class SimplifiedCoalPowerPlant implements IEnergySource {
  private static readonly CO2_EMISSIONS = 740;

  private readonly usages: IEnergyUsage[] = [];

  private consumption: number = 0;

  private readonly pollutions: Map<Pollutions, number> = new Map();

  private lifespan: number = 100 * 24 * 365;

  constructor() {}

  connectUsage(usage: IEnergyUsage) {
    this.usages.push(usage);
  }

  measure(elapsedTime: number) {
    for (const usage of this.usages) {
      this.consumption = usage.expectedConsumption(elapsedTime);
      this.pollutions.set(
        Pollutions.CO2,
        SimplifiedCoalPowerPlant.CO2_EMISSIONS * this.consumption,
      );
    }
    this.lifespan = Math.max(0, this.lifespan - elapsedTime);
  }

  getConsumption() {
    return this.consumption;
  }

  getPollution(pollution: Pollutions) {
    return this.pollutions.get(pollution) || 0;
  }

  getLifespan() {
    return this.lifespan;
  }
}

export class SimplifiedWindmill implements IEnergySource {
  private lifespan: number = 30 * 24 * 365;

  constructor() {}
  connectUsage(usage: IEnergyUsage) {}
  measure(elapsedTime: number) {
    this.lifespan = Math.max(0, this.lifespan - elapsedTime);
  }

  getConsumption() {
    return 0;
  }

  getPollution(pollution: Pollutions) {
    return 0;
  }

  getLifespan() {
    return this.lifespan;
  }
}

export class WindMillFactory implements IEnergySourceFactory {
  constructor() {}

  build() {
    return new SimplifiedWindmill();
  }
}

export class SimpleEnergyGrid {
  constructor() {}
  connectSource(source: IEnergySource) {}
  connectUsage(usage: IEnergyUsage) {}
}

export class HumanUsages implements IEnergyUsage {
  constructor() {}
  expectedConsumption(elapsedTime: number) {
    return 0;
  }
}

export class WindmillSimulation {
  constructor(grid: SimpleEnergyGrid, windMillFactory: WindMillFactory) {}
  start() {}
  step() {}
  totalConsumption() {}
  totalPollution() {}
  totalWindMill() {}
}
