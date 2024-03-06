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
