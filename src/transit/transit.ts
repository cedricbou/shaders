export enum SimulationStatus {
  Start,
  InProgress,
  End,
}

export interface Load {
  load(): number;
  iterate(): void;
}

export interface Overloadable {
  /**
   * Indicate is the source is overloaded.
   * An overloaded source should not be used to provide energy.
   * @returns true if the source is overloaded
   */
  isOverloaded(): boolean;

  /**
   * Indicate the number of time the source has been overloaded.
   */
  getOverloadCount(): number;

  /**
   * Rearm the source to allow it to be used again.
   * It must reset the overloaded flag.
   */
  rearm(): void;
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

export class EnergySource implements Overloadable {
  private overloadCount: number = 0;

  // The iteration amount of energy consumed kept for rollback.
  private lastConsumption: number = 0;

  // The iteration overloaded flag, reset on prepare.
  private overloaded: boolean = false;

  // The flag to check if an interation transaction is in progress.

  constructor(
    private energyQuantity: number,
    private readonly energyCapacity: number,
  ) {}

  public iterate(load: number): number {
    // Reset last consumption
    this.lastConsumption = 0;

    // Protect and prevent usage of source when out of energy
    if (this.outOfEnergy()) {
      throw new Error('Out of energy');
    }

    // Prevent overloaded source to be used
    if (this.isOverloaded()) {
      throw new Error('Overloaded');
    }

    // Check for overload, no load is consumed in this case.
    if (load > this.energyCapacity) {
      this.overloaded = true;
      this.overloadCount++;
      return load;
    }

    // Record last consumption to allow rollback
    this.lastConsumption = Math.min(this.energyQuantity, load);

    // Energy has been consummed.
    this.energyQuantity -= this.lastConsumption;

    return load - this.lastConsumption;
  }

  public rollback() {
    this.energyQuantity += this.lastConsumption;
    this.overloaded = false;
  }

  public outOfEnergy(): boolean {
    return this.energyQuantity <= 0;
  }

  public getEnergyQuantity(): number {
    return this.energyQuantity;
  }

  public isOverloaded(): boolean {
    return this.overloaded;
  }

  public getOverloadCount(): number {
    return this.overloadCount;
  }

  public rearm() {
    this.overloaded = false;
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

  /** Count include in service or overloaded sources but excloude out of energy
   * @returns the number of sources not out of energy
   */
  public countSources(): number {
    return this.sources.reduce(
      (acc, source) =>
        acc + (source.outOfEnergy() || source.isOverloaded() ? 0 : 1),
      0,
    );
  }

  /**
   * Exploitable sources are sources that are not out of energy and not overloaded.
   * @returns the number of exploitable sources
   */
  public countExploitableSources(): number {
    return this.sources.reduce(
      (acc, source) =>
        acc + (source.outOfEnergy() || source.isOverloaded() ? 0 : 1),
      0,
    );
  }

  private garbageSources() {
    this.sources = this.sources.filter((source) => !source.outOfEnergy());
  }

  private shareLoad(load: number): number {
    const count = this.countExploitableSources();
    const shared = load / count;
    let remaining = 0;

    this.sources.forEach((source) => {
      if (!source.outOfEnergy() && !source.isOverloaded()) {
        remaining += source.iterate(shared);
      }
    });

    return remaining;
  }

  public iterate() {
    const targetLoad = this.sumLoads();

    this.consumption += targetLoad;

    let remaining = this.shareLoad(targetLoad);

    while (remaining > 0 && this.countExploitableSources() > 0) {
      remaining = this.shareLoad(remaining);
    }

    if (remaining > 0) {
      this.sources.forEach((source) => source.rollback());
      this.consumption -= targetLoad;
    }

    this.garbageSources();
    this.rearmSources();
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

  public rearmSources() {
    this.sources.forEach((source) => source.rearm());
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
    if (this.ellapsedHours % 100 === 0) {
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
