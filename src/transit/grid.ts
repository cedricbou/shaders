import { EnergySource, Load, Overloadable } from './energy';

export class Grid implements Overloadable {
  private consumption: number = 0;

  private overloaded: boolean = false;
  private overloadCount: number = 0;

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
      (acc, source) => acc + (source.outOfEnergy() ? 0 : 1),
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

  public getSourceOverloadedIncidents(): number {
    return this.sources.reduce(
      (acc, source) => acc + source.getOverloadCount(),
      0,
    );
  }

  private garbageSources() {
    this.sources = this.sources.filter((source) => !source.outOfEnergy());
  }

  private shareLoad(load: number): number {
    const count = this.countExploitableSources();
    const shared = load / count;
    return shared;
  }

  private consumeLoad(load: number): boolean {
    let overload = false;

    const consumedSources: EnergySource[] = [];

    this.sources.forEach((source) => {
      if (!source.outOfEnergy() && !source.isOverloaded()) {
        if (source.iterate(load) > 0) {
          overload = true;
        } else {
          consumedSources.push(source);
        }
      }
    });

    if (overload) {
      consumedSources.forEach((source) => source.rollback());
    }

    return !overload;
  }

  public iterate() {
    if (this.isOverloaded()) {
      throw new Error('Overloaded');
    }

    const targetLoad = this.sumLoads();

    this.consumption += targetLoad;

    let sharedLoad = this.shareLoad(targetLoad);

    // While there are exploitable sources
    // and an overload was detected, retry
    while (
      this.countExploitableSources() > 0 &&
      !this.consumeLoad(sharedLoad)
    ) {
      sharedLoad = this.shareLoad(targetLoad);
    }

    if (this.countExploitableSources() == 0) {
      this.overloaded = true;
      this.overloadCount++;
      this.consumption -= targetLoad;
    } else {
      this.rearmSources();
    }

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

  public rearm() {
    this.overloaded = false;
    this.sources.forEach((source) => source.rearm());
  }

  private rearmSources() {
    this.sources.forEach((source) => source.rearm());
  }

  public isOverloaded(): boolean {
    return this.overloaded;
  }

  public getOverloadCount(): number {
    return this.overloadCount;
  }
}
