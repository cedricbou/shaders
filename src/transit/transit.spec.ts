import { describe, expect, test, vi } from 'vitest';
import { mock, mockClear, mockReset } from 'vitest-mock-extended';

import * as tx from './transit';

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
  test('should consume coal', () => {
    const coalPowerPlant = new tx.SimplifiedCoalPowerPlant();
    const consume = mock(coalPowerPlant.consume);
    coalPowerPlant.consume();
    expect(consume).toHaveBeenCalled();
  });
});
