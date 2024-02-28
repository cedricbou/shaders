import { describe, expect, test, vi } from 'vitest';
import { mock, mockClear, mockReset } from 'vitest-mock-extended';

import * as tx from './transit';
import { exp } from 'three/examples/jsm/nodes/Nodes.js';

class SteadyUsage implements tx.IEnergyUsage {
  expectedConsumption(elapsedTime: number) {
    return 1000 * elapsedTime;
  }
}

/**
 * Check if with limited primary energy resource we can build secondary
 * source of energy and use them to build and maintain only secondary energy
 * source
 *
 * We'll use a burning energy like coal as the primary source of energy.
 * We'll use simplified wind turbine as the secondary source of energy.
 *
 * We'll assume a constant consumption of energy for human usages.
 *
 * The test succeed if the creation of newer wind turbines can be done
 * with existing wind turbines
 */
describe('A simple energy transformation scenario', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('should allow providing enough energy for usages while allowing maintaining enough windmills', () => {
    // Given a coal power plant with a limited amount of coal, constant production and known pollutions.
    const coalPowerPlant = new tx.SimplifiedCoalPowerPlant();

    // Given a windmill known constant production and known pollutions and consumption for its maintenance.
    // The Windmill has a known lifespan before being replaced.
    // const windmill = new SimplifiedWindmill();

    // Given a windmill
    const windMillFactory = new tx.WindMillFactory();

    const grid = new tx.SimpleEnergyGrid();

    const humanUsages = new tx.HumanUsages();

    grid.connectSource(coalPowerPlant);
    grid.connectUsage(humanUsages);

    const simulation = new tx.WindmillSimulation(grid, windMillFactory);

    vi.setSystemTime(new Date(2010, 1, 1, 19));

    simulation.start();

    vi.setSystemTime(new Date(2030, 1, 1, 19));

    simulation.step();

    expect(simulation.totalConsumption()).toBeGreaterThan(0);
    expect(simulation.totalPollution()).toBeLessThan(1000);
    expect(simulation.totalWindMill()).toBeLessThan(50000);
  });
});

describe('A coal power plant', () => {
  test('should produce a steady energy coal under constant load below capacity', () => {
    // Create our power plant
    const coalPowerPlant = new tx.SimplifiedCoalPowerPlant();

    // Connect a steady usage below capacity
    coalPowerPlant.connectUsage(new SteadyUsage());

    // Check it starts with zero metrics
    expect(coalPowerPlant.getPollution(tx.Pollutions.CO2)).toBe(0);
    expect(coalPowerPlant.getConsumption()).toBe(0);

    // Measure the power plant after 100 hours since turned on
    coalPowerPlant.measure(100);

    let expectedConsumption = 100 * 1000;
    let expectedCo2 = 740 * expectedConsumption;

    expect(coalPowerPlant.getConsumption()).toBe(expectedConsumption);
    expect(coalPowerPlant.getPollution(tx.Pollutions.CO2)).toBe(expectedCo2);

    // Check after 1000 hours since turned on
    coalPowerPlant.measure(1000);

    expectedConsumption = 1000 * 1000;
    expectedCo2 = 740 * expectedConsumption;

    expect(coalPowerPlant.getConsumption()).toBe(expectedConsumption);
    expect(coalPowerPlant.getPollution(tx.Pollutions.CO2)).toBe(expectedCo2);
  });
});

describe('a windmill factory', () => {
  test('should produce a windmill', () => {
    const factory = new tx.WindMillFactory();

    const windmill = factory.build();

    expect(windmill).toBeDefined();
    expect(windmill.getLifespan()).toBe(30 * 24 * 365);
    expect(windmill.getConsumption()).toBe(0);
    expect(windmill.getPollution(tx.Pollutions.CO2)).toBe(0);
  });
});

describe('a simplified windmill', () => {
  test('should produce a steady energy under constant load below capacity', () => {
    const windmill = new tx.SimplifiedWindmill();

    windmill.connectUsage(new SteadyUsage());

    expect(windmill.getPollution(tx.Pollutions.CO2)).toBe(0);
    expect(windmill.getConsumption()).toBe(0);

    windmill.measure(100);

    expect(windmill.getConsumption()).toBe(0);
    expect(windmill.getPollution(tx.Pollutions.CO2)).toBe(0);
  });

  test('should have a lifespan of 30 years', () => {
    const windmill = new tx.SimplifiedWindmill();

    expect(windmill.getLifespan()).toBe(30 * 24 * 365);
  });

  test('lifespan should linearly decrease with time', () => {
    const windmill = new tx.SimplifiedWindmill();
    windmill.measure(100);

    expect(windmill.getLifespan()).toBe(30 * 24 * 365 - 100);
  });

  test('lifespan should be 0 after EOL', () => {
    const windmill = new tx.SimplifiedWindmill();
    windmill.measure(30 * 24 * 365);
    expect(windmill.getLifespan()).toBe(0);

    windmill.measure(2 * 30 * 24 * 365);
    expect(windmill.getLifespan()).toBe(0);
  });
});
