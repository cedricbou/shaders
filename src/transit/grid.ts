import { EnergySource, Load } from './energy';

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
