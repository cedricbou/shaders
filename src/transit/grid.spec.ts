import { describe, expect, test } from 'vitest';

import * as tx from './transit';

describe('A grid', () => {
  test('should be able to connect to different sources and consume them', () => {
    const windmill1 = new tx.WindTurbine();
    const windmill2 = new tx.WindTurbine();
    const windmill3 = new tx.WindTurbine();

    const grid = new tx.Grid(
      [new tx.SteadyEnergyUsage(2)],
      [windmill1, windmill2, windmill3],
    );

    expect(grid.getConsumption()).toBe(0);
    expect(grid.countSources()).toBe(3);

    grid.iterate();

    expect(grid.getConsumption()).toBe(2);
    expect(grid.countSources()).toBe(3);

    grid.connect(new tx.WindTurbine());

    expect(grid.getConsumption()).toBe(2);
    expect(grid.countSources()).toBe(4);

    grid.iterate();

    expect(grid.getConsumption()).toBe(4);
  });

  test('should share loads of non overloaded resource in case over consumption of one of the source, if the left sources supports it, it succeed', () => {
    const windmill1 = new tx.WindTurbine();
    const windmill2 = new tx.WindTurbine();
    const windmill3 = new tx.WindTurbine();
    const customEnergySource = new tx.EnergySource(100, 5);

    const grid = new tx.Grid(
      [new tx.SteadyEnergyUsage(5)],
      [windmill1, windmill2, windmill3, customEnergySource],
    );

    expect(windmill1.getOverloadCount()).toBe(0);
    expect(windmill2.getOverloadCount()).toBe(0);
    expect(windmill3.getOverloadCount()).toBe(0);
    expect(customEnergySource.getOverloadCount()).toBe(0);
    expect(grid.getConsumption()).toBe(0);

    grid.iterate();

    expect(windmill1.getOverloadCount()).toBe(1);
    expect(windmill2.getOverloadCount()).toBe(1);
    expect(windmill3.getOverloadCount()).toBe(1);
    expect(customEnergySource.getOverloadCount()).toBe(0);
    expect(grid.getConsumption()).toBe(5);
    expect(grid.countSources()).toBe(4);
    expect(grid.countExploitableSources()).toBe(4);
  });

  test('should share loads of non overloaded resource in case over consumption of one of the source, if the left sources does supports it, it fails', () => {
    const windmill1 = new tx.WindTurbine();
    const windmill2 = new tx.WindTurbine();
    const windmill3 = new tx.WindTurbine();
    const customEnergySource = new tx.EnergySource(100, 3);

    const grid = new tx.Grid(
      [new tx.SteadyEnergyUsage(6)],
      [windmill1, windmill2, windmill3, customEnergySource],
    );

    expect(windmill1.getOverloadCount()).toBe(0);
    expect(windmill2.getOverloadCount()).toBe(0);
    expect(windmill3.getOverloadCount()).toBe(0);
    expect(customEnergySource.getOverloadCount()).toBe(0);
    expect(grid.getConsumption()).toBe(0);

    grid.iterate();

    expect(windmill1.getOverloadCount()).toBe(1);
    expect(windmill2.getOverloadCount()).toBe(1);
    expect(windmill3.getOverloadCount()).toBe(1);
    expect(customEnergySource.getOverloadCount()).toBe(1);
    expect(grid.getConsumption()).toBe(0);
    expect(grid.countSources()).toBe(4);
    expect(grid.countExploitableSources()).toBe(4);
  });

  test('should overload when it is not able to provide the requested load', () => {
    const source1 = new tx.EnergySource(5, 1);
    const source2 = new tx.EnergySource(5, 1);
    const source3 = new tx.EnergySource(5, 1);

    const grid = new tx.Grid(
      [new tx.SteadyEnergyUsage(5)],
      [source1, source2, source3],
    );

    expect(grid.getConsumption()).toBe(0);

    grid.iterate();

    expect(grid.getConsumption()).toBe(0);
    expect(grid.isOverloaded()).toBe(true);
    expect(grid.getOverloadCount()).toBe(1);

    expect(() => {
      grid.iterate();
    }).toThrowError('Overloaded');
  });
});
