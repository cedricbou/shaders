//Typescript
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var SteadyEnergyUsage = /** @class */ (function () {
    function SteadyEnergyUsage() {
    }
    SteadyEnergyUsage.prototype.load = function () {
        return 1000;
    };
    SteadyEnergyUsage.prototype.iterate = function () { };
    return SteadyEnergyUsage;
}());
var WindTurbineFactory = /** @class */ (function () {
    function WindTurbineFactory() {
        this.builtSinceLastIteration = 0;
        this.built = 0;
    }
    WindTurbineFactory.prototype.load = function () {
        return 80000 * this.builtSinceLastIteration;
    };
    WindTurbineFactory.prototype.build = function () {
        this.builtSinceLastIteration++;
        this.built++;
        return new WindTurbine();
    };
    WindTurbineFactory.prototype.iterate = function () {
        this.builtSinceLastIteration = 0;
    };
    WindTurbineFactory.prototype.getBuilt = function () {
        return this.built;
    };
    return WindTurbineFactory;
}());
var EnergySource = /** @class */ (function () {
    function EnergySource(energyQuantity, energyCapacity) {
        this.energyQuantity = energyQuantity;
        this.energyCapacity = energyCapacity;
    }
    EnergySource.prototype.iterate = function (load) {
        if (this.outOfEnergy()) {
            throw new Error('Out of energy');
        }
        var required = load;
        var applicable = Math.min(this.energyQuantity, Math.min(this.energyCapacity, required));
        this.energyQuantity -= applicable;
        return required - applicable;
    };
    EnergySource.prototype.outOfEnergy = function () {
        return this.energyQuantity <= 0;
    };
    EnergySource.prototype.getEnergyQuantity = function () {
        return this.energyQuantity;
    };
    return EnergySource;
}());
var WindTurbine = /** @class */ (function (_super) {
    __extends(WindTurbine, _super);
    function WindTurbine() {
        return _super.call(this, 50000, 1000) || this;
    }
    return WindTurbine;
}(EnergySource));
var CoalPowerPlant = /** @class */ (function (_super) {
    __extends(CoalPowerPlant, _super);
    function CoalPowerPlant() {
        return _super.call(this, 219000000000, 1000000) || this;
    }
    return CoalPowerPlant;
}(EnergySource));
var Grid = /** @class */ (function () {
    function Grid(loads, sources) {
        this.loads = loads;
        this.sources = sources;
        this.consumption = 0;
    }
    Grid.prototype.sumLoads = function () {
        return this.loads.reduce(function (acc, load) { return acc + load.load(); }, 0);
    };
    Grid.prototype.countSources = function () {
        return this.sources.reduce(function (acc, source) { return acc + (source.outOfEnergy() ? 0 : 1); }, 0);
    };
    Grid.prototype.garbageSources = function () {
        this.sources = this.sources.filter(function (source) { return !source.outOfEnergy(); });
    };
    Grid.prototype.shareLoad = function (load) {
        var count = this.countSources();
        var shared = load / count;
        var remaining = 0;
        this.sources.forEach(function (source) {
            if (!source.outOfEnergy()) {
                remaining += source.iterate(shared);
            }
        });
        return remaining;
    };
    Grid.prototype.iterate = function () {
        var remaining = this.sumLoads();
        this.consumption += remaining;
        while (remaining > 0 && this.countSources() > 0) {
            remaining = this.shareLoad(remaining);
        }
        this.consumption -= remaining;
        this.garbageSources();
        this.loads.forEach(function (load) { return load.iterate(); });
    };
    Grid.prototype.connect = function (source) {
        this.sources.push(source);
    };
    Grid.prototype.isOutOfEnergy = function () {
        return this.countSources() === 0;
    };
    Grid.prototype.getConsumption = function () {
        return this.consumption;
    };
    return Grid;
}());
var Simulation = /** @class */ (function () {
    function Simulation(coalPowerPlant, windTurbineFactory) {
        this.coalPowerPlant = coalPowerPlant;
        this.windTurbineFactory = windTurbineFactory;
        this.ellapsedHours = 0;
        this.grid = new Grid([new SteadyEnergyUsage(), windTurbineFactory], [coalPowerPlant]);
    }
    Simulation.prototype.iterate = function () {
        this.grid.iterate();
        this.ellapsedHours++;
        // Built 5 new wind turbines yearly
        if (this.ellapsedHours % 1752 === 0) {
            var turbine = this.windTurbineFactory.build();
            this.grid.connect(turbine);
        }
    };
    Simulation.prototype.simulate = function () {
        while (!this.grid.isOutOfEnergy() || this.ellapsedHours < 100000000) {
            this.iterate();
        }
        this.printResults();
    };
    Simulation.prototype.printResults = function () {
        console.log('Total consumption:', this.grid.getConsumption);
        console.log('Total wind turbines:', this.windTurbineFactory.getBuilt());
        console.log('Total sources left:', this.grid.countSources());
        console.log('Total ellapsed hours:', this.ellapsedHours);
        console.log('Total coal power plant left energy:', this.coalPowerPlant.getEnergyQuantity());
    };
    return Simulation;
}());
var simulation = new Simulation(new CoalPowerPlant(), new WindTurbineFactory());
simulation.simulate();
