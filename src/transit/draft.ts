import {
  CoalPowerPlant,
  Grid,
  WindTurbineFactory,
  Simulation,
  SimulationStatus,
} from './transit';

const powerPlants = [new CoalPowerPlant(), new CoalPowerPlant()];
const windTurbineFactory = new WindTurbineFactory();

function printAsciiProgressBar(
  ellapsedHours: number,
  maxIterationInHours: number,
) {
  if (ellapsedHours % 100 !== 0) return;
  const percentage = (ellapsedHours / maxIterationInHours) * 100;

  const filledBarItem: string = '\x1b[32m█\x1b[0m';
  const grayedBarItem = '\x1b[90m▒\x1b[0m';
  const barSize = 68;
  const bar = Array(Math.floor(percentage / (100.0 / barSize)))
    .fill(filledBarItem)
    .join('');
  process.stdout.write(
    `[${bar}${grayedBarItem.repeat(barSize - bar.length / filledBarItem.length)}] ${percentage.toFixed(4)}%\r`,
  );
}

function printUpdatedResultsInPlace(
  grid: Grid,
  windTurbineFactory: WindTurbineFactory,
  coalPowerPlants: Array<CoalPowerPlant>,
  ellapsedHours: number,
) {
  process.stdout.write(
    '\r' +
      '◇'.repeat(80) +
      '\n' +
      (grid.isOverloaded() ? '==> [X] Grid is overloaded\n' : '') +
      `Total consumption: ${(grid.getConsumption() / 1000).toFixed(3)} GWh \n` +
      `Total wind turbines: ${windTurbineFactory.getBuilt()} \n` +
      `Total overloaded sources: ${grid.getSourceOverloadedIncidents()} \n` +
      `Total sources left: ${grid.countSources()} \n` +
      `Total ellapsed hours: ${ellapsedHours}, around ${
        ellapsedHours / 24 / 365.25
      } years \n` +
      `Total coal power plant left energy: ${(
        coalPowerPlants.reduce(
          (acc, plant) => acc + plant.getEnergyQuantity(),
          0,
        ) / 1000
      ).toFixed(3)} GWh\n` +
      `Total wind turbine factory consumed energy: ${(windTurbineFactory.getConsumption() / 1000).toFixed(3)} GWh\n`,
  );
}

let lastTimeStamp = performance.now();
let lastIteration = 0;

const progressCallback =
  (simulation: Simulation) =>
  (ellapsedHour: number, status: SimulationStatus) => {
    if (status === SimulationStatus.Start || status === SimulationStatus.End) {
      printUpdatedResultsInPlace(
        simulation.getGrid(),
        windTurbineFactory,
        powerPlants,
        ellapsedHour,
      );
    }
    const now = performance.now();
    const delta = now - lastTimeStamp;
    if (delta > 5000) {
      printUpdatedResultsInPlace(
        simulation.getGrid(),
        windTurbineFactory,
        powerPlants,
        ellapsedHour,
      );
      lastTimeStamp = now;
    }

    const deltaIteration = ellapsedHour - lastIteration;

    if (deltaIteration % 100 === 0) {
      printAsciiProgressBar(ellapsedHour, simulation.getMaximumIteration());
    }
  };

const simulation = new Simulation(powerPlants, windTurbineFactory);

simulation.simulate(progressCallback(simulation));
