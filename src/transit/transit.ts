export enum SimulationStatus {
  Start,
  InProgress,
  End,
}

export interface Load {
  load(): number;
  iterate(): void;
}

export class SteadyEnergyUsage implements Load {
  constructor(private readonly loadValue: number = 1000) {}

  public load(): number {
    return this.loadValue;
  }

  public iterate() {}
}

export class WindTurbineFactory implements Load {
  private builtSinceLastIteration: number = 0;
  private built: number = 0;
  private consumption: number = 0;

  public readonly BUILD_LOAD = 80;

  public load(): number {
    return this.BUILD_LOAD * this.builtSinceLastIteration;
  }

  public build(): WindTurbine {
    this.builtSinceLastIteration++;
    this.built++;
    return new WindTurbine();
  }

  public iterate() {
    this.consumption += this.load();
    this.builtSinceLastIteration = 0;
  }

  public getBuilt(): number {
    return this.built;
  }

  public getConsumption(): number {
    return this.consumption + this.load();
  }
}

export class EnergySource {
  constructor(
    private energyQuantity: number,
    private readonly energyCapacity: number,
  ) {}

  public iterate(load: number): number {
    if (this.outOfEnergy()) {
      throw new Error('Out of energy');
    }

    const applicable = Math.min(
      this.energyQuantity,
      Math.min(this.energyCapacity, load),
    );

    this.energyQuantity -= applicable;

    return load - applicable;
  }

  public outOfEnergy(): boolean {
    return this.energyQuantity <= 0;
  }

  public getEnergyQuantity(): number {
    return this.energyQuantity;
  }
}

export class WindTurbine extends EnergySource {
  constructor() {
    super(50000, 1);
  }
}

export class CoalPowerPlant extends EnergySource {
  constructor() {
    super(219000000, 1000);
  }
}

export class Grid {
  private consumption: number = 0;

  constructor(
    private readonly loads: Array<Load>,
    private sources: Array<EnergySource>,
  ) {}

  private sumLoads(): number {
    return this.loads.reduce((acc, load) => acc + load.load(), 0);
  }

  public countSources(): number {
    return this.sources.reduce(
      (acc, source) => acc + (source.outOfEnergy() ? 0 : 1),
      0,
    );
  }

  private garbageSources() {
    this.sources = this.sources.filter((source) => !source.outOfEnergy());
  }

  private shareLoad(load: number): number {
    const count = this.countSources();
    const shared = load / count;
    let remaining = 0;

    this.sources.forEach((source) => {
      if (!source.outOfEnergy()) {
        remaining += source.iterate(shared);
      }
    });

    return remaining;
  }

  public iterate() {
    let remaining = this.sumLoads();
    this.consumption += remaining;

    while (remaining > 0 && this.countSources() > 0) {
      remaining = this.shareLoad(remaining);
    }

    this.consumption -= remaining;

    this.garbageSources();

    this.loads.forEach((load) => load.iterate());
  }

  public connect(source: EnergySource) {
    this.sources.push(source);
  }

  public isOutOfEnergy(): boolean {
    return this.countSources() === 0;
  }

  public getConsumption(): number {
    return this.consumption;
  }
}

export class Simulation {
  private readonly grid: Grid;
  private ellapsedHours: number = 0;

  constructor(
    coalPowerPlants: Array<CoalPowerPlant>,
    private readonly windTurbineFactory: WindTurbineFactory,
    private readonly maxIteration: number = 365 * 24 * 500,
  ) {
    this.grid = new Grid(
      [new SteadyEnergyUsage(), windTurbineFactory],
      [...coalPowerPlants],
    );
  }

  public iterate() {
    this.grid.iterate();
    this.ellapsedHours++;

    // Built 5 new wind turbines yearly
    if (this.ellapsedHours % 50 === 0) {
      const turbine = this.windTurbineFactory.build();
      this.grid.connect(turbine);
    }
  }

  public simulate(
    progressCallback?: (ellapsedHour: number, status: SimulationStatus) => void,
  ) {
    progressCallback?.(this.ellapsedHours, SimulationStatus.Start);
    while (
      !this.grid.isOutOfEnergy() &&
      this.ellapsedHours < this.maxIteration
    ) {
      this.iterate();

      if (this.ellapsedHours % 1000 === 0) {
        progressCallback?.(this.ellapsedHours, SimulationStatus.InProgress);
      }
    }
    progressCallback?.(this.ellapsedHours, SimulationStatus.End);
  }

  public getGrid(): Grid {
    return this.grid;
  }

  public getMaximumIteration(): number {
    return this.maxIteration;
  }
}
