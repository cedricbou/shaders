import { describe, expect, test } from 'vitest';

import * as tx from './transit';

describe('A steady energy load', () => {
  test('should require a constant load at any time', () => {
    const steady = new tx.SteadyEnergyUsage(100);

    expect(steady.load()).toBe(100);

    for (let i = 0; i < 100; i++) {
      steady.iterate();
      expect(steady.load()).toBe(100);
    }
  });
});

describe('An energy source', () => {
  test('should be able to support totally any amount of load below its capacity', () => {
    const totalQuanity = 10000;
    const maximumCapacity = 100;
    const source = new tx.EnergySource(totalQuanity, maximumCapacity);
    expect(source.outOfEnergy()).toBe(false);

    const testLoad1 = 50;
    const testLoad2 = 100;
    const testLoad3 = 20;

    const remaining1 = source.iterate(testLoad1);
    expect(source.outOfEnergy()).toBe(false);
    expect(source.getEnergyQuantity()).toBe(totalQuanity - testLoad1);
    expect(remaining1).toBe(0);

    const remaining2 = source.iterate(testLoad2);
    expect(source.outOfEnergy()).toBe(false);
    expect(source.getEnergyQuantity()).toBe(
      totalQuanity - testLoad1 - testLoad2,
    );
    expect(remaining2).toBe(0);

    const remaining3 = source.iterate(testLoad3);
    expect(source.outOfEnergy()).toBe(false);
    expect(source.getEnergyQuantity()).toBe(
      totalQuanity - testLoad1 - testLoad2 - testLoad3,
    );
    expect(remaining3).toBe(0);
  });

  // TODO: Actually we should clarify the behavior when a load is above the capacity
  //       Should we disconnect the source, like in real life ?
  //       Or should we just cap the load to the capacity, like it's done for now.
  test('should throw an error when out of energy', () => {
    const totalQuanity = 300;
    const maximumCapacity = 300;
    const source = new tx.EnergySource(totalQuanity, maximumCapacity);

    const testLoad = 300;

    const remaining = source.iterate(testLoad);

    expect(source.outOfEnergy()).toBe(true);
    expect(remaining).toBe(testLoad - totalQuanity);

    expect(() => source.iterate(1)).toThrow('Out of energy');
  });

  test('should be able to rollback the last iteration under normal load condition', () => {
    const totalQuantity = 10000;
    const maximumCapacity = 100;
    const source = new tx.EnergySource(totalQuantity, maximumCapacity);

    const testLoad = 50;

    const remaining = source.iterate(testLoad);
    expect(source.getEnergyQuantity()).toBe(totalQuantity - testLoad);
    expect(remaining).toBe(0);

    source.rollback();

    expect(source.getEnergyQuantity()).toBe(totalQuantity);
  });

  test('shoud indicate when overloaded', () => {
    const totalQuantity = 10000;
    const maximumCapacity = 100;
    const source = new tx.EnergySource(totalQuantity, maximumCapacity);

    const testLoad = 150;

    const remaining = source.iterate(testLoad);

    expect(source.isOverloaded()).toBe(true);
    expect(source.getOverloadCount()).toBe(1);
    expect(source.getEnergyQuantity()).toBe(totalQuantity);
    expect(remaining).toBe(testLoad);
  });

  test('should be able to rollback the last iteration under overload condition', () => {
    const totalQuantity = 10000;
    const maximumCapacity = 100;
    const source = new tx.EnergySource(totalQuantity, maximumCapacity);

    const testLoad = 150;

    const remaining = source.iterate(testLoad);

    expect(source.getEnergyQuantity()).toBe(totalQuantity);
    expect(source.isOverloaded()).toBe(true);
    expect(remaining).toBe(testLoad);

    source.rollback();

    expect(source.getEnergyQuantity()).toBe(totalQuantity);
    expect(source.isOverloaded()).toBe(false);
  });

  test('acting as a Windmill should be able to produce 1MW of energy per iteration and up to 50GW throuhg its life', () => {
    const windmill = new tx.WindTurbine();

    expect(windmill.getEnergyQuantity()).toBe(50000);

    expect(windmill.iterate(1)).toBe(0);
    expect(windmill.iterate(0.8)).toBe(0);
    expect(windmill.isOverloaded()).toBe(false);

    windmill.iterate(1.1);

    expect(windmill.isOverloaded()).toBe(true);
  });

  test('acting as a Coal Power Plant should be able to produce 1GW of energy per iteration and up to 219GW throuhg its life', () => {
    const plant = new tx.CoalPowerPlant();

    expect(plant.getEnergyQuantity()).toBe(219000000);

    expect(plant.iterate(1000)).toBe(0);
    expect(plant.iterate(800)).toBe(0);
    expect(plant.isOverloaded()).toBe(false);

    plant.iterate(1100);

    expect(plant.isOverloaded()).toBe(true);
  });
});

describe('A Wind Turbine Factory', () => {
  test('should not consume anything if no windmill has been built', () => {
    const factory = new tx.WindTurbineFactory();

    expect(factory.getConsumption()).toBe(0);
    expect(factory.getBuilt()).toBe(0);
    expect(factory.load()).toBe(0);

    factory.iterate();

    expect(factory.getConsumption()).toBe(0);
    expect(factory.getBuilt()).toBe(0);
    expect(factory.load()).toBe(0);
  });

  test('should consume 1MW of energy per windmill built', () => {
    const factory = new tx.WindTurbineFactory();

    factory.build();
    expect(factory.getConsumption()).toBe(1 * factory.BUILD_LOAD);
    expect(factory.getBuilt()).toBe(1);
    expect(factory.load()).toBe(1 * factory.BUILD_LOAD);

    factory.iterate();

    expect(factory.getConsumption()).toBe(1 * factory.BUILD_LOAD);
    expect(factory.getBuilt()).toBe(1);
    expect(factory.load()).toBe(0);

    factory.build();
    factory.build();

    expect(factory.getConsumption()).toBe(3 * factory.BUILD_LOAD);
    expect(factory.getBuilt()).toBe(3);
    expect(factory.load()).toBe(2 * factory.BUILD_LOAD);

    factory.iterate();

    expect(factory.getConsumption()).toBe(3 * factory.BUILD_LOAD);
    expect(factory.getBuilt()).toBe(3);
    expect(factory.load()).toBe(0);
  });
});

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
});
