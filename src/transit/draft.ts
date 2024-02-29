//Typescript

interface Load {
  load(): number;
  iterate(): void;
}

class SteadyEnergyUsage implements Load {
  public load(): number {
    return 1000;
  }

  public iterate() {}
}

class WindTurbineFactory implements Load {
  private builtSinceLastIteration: number = 0;
  private built: number = 0;
  private consumption: number = 0;

  public load(): number {
    return 80 * this.builtSinceLastIteration;
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
    return this.consumption;
  }
}

class EnergySource {
  constructor(
    private energyQuantity: number,
    private readonly energyCapacity: number,
  ) {}

  public iterate(load: number): number {
    if (this.outOfEnergy()) {
      throw new Error('Out of energy');
    }

    const required = load;
    const applicable = Math.min(
      this.energyQuantity,
      Math.min(this.energyCapacity, required),
    );

    this.energyQuantity -= applicable;

    return required - applicable;
  }

  public outOfEnergy(): boolean {
    return this.energyQuantity <= 0;
  }

  public getEnergyQuantity(): number {
    return this.energyQuantity;
  }
}

class WindTurbine extends EnergySource {
  constructor() {
    super(50000, 1);
  }
}

class CoalPowerPlant extends EnergySource {
  constructor() {
    super(219000000, 1000);
  }
}

class Grid {
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

class Simulation {
  private readonly grid: Grid;
  private ellapsedHours: number = 0;
  private lastTimestamp = performance.now();

  constructor(
    private readonly coalPowerPlants: Array<CoalPowerPlant>,
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

  public simulate() {
    this.printUpdatedResultsInPlace(false);
    while (
      !this.grid.isOutOfEnergy() &&
      this.ellapsedHours < this.maxIteration
    ) {
      this.iterate();
      this.printAsciiProgressBar();
      this.printUpdatedResultsInPlace();
    }
    this.printUpdatedResultsInPlace(false);
  }

  public printAsciiProgressBar() {
    if (this.ellapsedHours % 100 !== 0) return;
    const percentage = ((this.ellapsedHours / this.maxIteration) * 100).toFixed(
      4,
    );

    const filledBarItem: string = '\x1b[32m█\x1b[0m';
    const grayedBarItem = '\x1b[90m█\x1b[0m';
    const bar = Array(Math.floor(percentage / 2))
      .fill(filledBarItem)
      .join('');
    process.stdout.write(
      `[${bar}${grayedBarItem.repeat(50 - bar.length / filledBarItem.length)}] ${percentage}%\r`,
    );
  }

  public printUpdatedResultsInPlace(lessOften: boolean = true) {
    const now = performance.now();
    if (lessOften && now - this.lastTimestamp <= 5000.0) return;
    this.lastTimestamp = now;
    process.stdout.write(
      '\r' +
        (!lessOften ? '-'.repeat(50) + '\n' : '') +
        `Total consumption: ${(this.grid.getConsumption() / 1000).toFixed(3)} GWh \n` +
        `Total wind turbines: ${this.windTurbineFactory.getBuilt()} \n` +
        `Total sources left: ${this.grid.countSources()} \n` +
        `Total ellapsed hours: ${this.ellapsedHours}, around ${
          this.ellapsedHours / 24 / 365.25
        } years \n` +
        `Total coal power plant left energy: ${(
          this.coalPowerPlants.reduce(
            (acc, plant) => acc + plant.getEnergyQuantity(),
            0,
          ) / 1000
        ).toFixed(3)} GWh\n` +
        `Total wind turbine factory consumed energy: ${(this.windTurbineFactory.getConsumption() / 1000).toFixed(3)} GWh\n`,
    );
  }
}

const simulation = new Simulation(
  [new CoalPowerPlant(), new CoalPowerPlant()],
  new WindTurbineFactory(),
);

simulation.simulate();
