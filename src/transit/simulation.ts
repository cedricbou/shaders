import { Grid } from './grid';
import {
  CoalPowerPlant,
  WindTurbineFactory,
  SteadyEnergyUsage,
} from './energy';

export enum SimulationStatus {
  Start,
  InProgress,
  End,
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
    if (this.ellapsedHours % 75 === 0) {
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
      !this.grid.isOverloaded() &&
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
