const DataSource = require("../data-source");
const { getTileTypeId } = require("../lib/config-helpers");

class ZoneBalanceData extends DataSource {
  constructor(city, config) {
    super();
    this.city = city;
    this.config = config;

    this.turbinesIndex = 5; // Default is happy

    this.tileTypeIds = {
      residential: getTileTypeId(this.config, "residential"),
      windTurbineSmall: getTileTypeId(this.config, "windTurbineSmall"),
      windTurbineBig: getTileTypeId(this.config, "windTurbineBig"),
    };

    this.idealPct = {
      residential:
        this.config.goals["zone-balance"]["ideal-residential-percentage"] ||
        0.5,
      windTurbine:
        this.config.goals["zone-balance"]["ideal-windTurbine-percentage"] ||
        0.25,
    };

    this.underdevelopedPct =
      this.config.goals["zone-balance"]["underdeveloped-percentage"] || 0.35;
    this.overdevelopedPct =
      this.config.goals["zone-balance"]["overdeveloped-percentage"] || 0.47;
    this.acceptablePctDiff =
      this.config.goals["zone-balance"]["acceptable-percentage-difference"] ||
      0.25;

    this.amount = {
      residential: 0,
      windTurbine: 0,
      windTurbineSmall: 0,
      windTurbineBig: 0,
    };
    this.underDevThreshold = {};
    this.overDevThreshold = {};
    const tileCount = this.city.map.width * this.city.map.height;

    Object.keys(this.tileTypeIds).forEach((type) => {
      // ADDED THIS IF CASE
      if (type == ("windTurbineSmall" || "windTurbineBig")) {
        type = "windTurbine";
      }
      this.underDevThreshold[type] = Math.round(
        this.idealPct[type] * this.underdevelopedPct * tileCount
      );
      this.overDevThreshold[type] = Math.round(
        this.idealPct[type] * this.overdevelopedPct * tileCount
      );
    });

    this.percentage = {
      residential: 0,
      windTurbine: 0,
      windTurbineSmall: 0,
      windTurbineBig: 0,
    };

    this.difference = {
      residential: 0,
      windTurbine: 0,
      windTurbineSmall: 0,
      windTurbineBig: 0,
    };
  }

  getVariables() {
    return {
      "residential-percentage": () => this.percentage.residential,
      "windTurbineSmall-percentage": () => this.percentage.windTurbineSmall,
      "windTurbineBig-percentage": () => this.percentage.windTurbineBig,
      "windTurbine-percentage": () => this.percentage.windTurbine,
      "residential-difference": () => this.difference.residential,
      "windTurbineSmall-difference": () => this.difference.windTurbineSmall,
      "windTurbineBig-difference": () => this.difference.windTurbineBig,
      "windTurbine-difference": () => this.difference.windTurbine,
      // Wind turbine index will also be calculated here.
      // It gives information about the question if there are enough wind turbines or not
      "wind-turbines-index": () => this.turbinesIndex,
    };
  }

  calculateIndex() {
    const energy =
      this.amount.residential -
        (this.amount.windTurbineSmall + this.amount.windTurbineBig * 2) !=
      0
        ? -(
            this.amount.residential -
            (this.amount.windTurbineSmall + this.amount.windTurbineBig * 2)
          )
        : 0;
    /*const perfectEnergy =
      this.amount.windTurbineSmall + this.amount.windTurbineBig * 2 ==
      this.amount.residential;*/

    // energy == 0 -> 5
    // energy == -1 -> 3
    // energy == -2 -> 2
    // energy <= -3 -> 1
    // energy == 1 || energy == 2 -> 4
    // energy == 3 -> 3
    // energy == 4 -> 2
    // energy >= 5 -> 1

    this.turbinesIndex =
      energy == 0
        ? 5
        : energy < 0
        ? energy == -1
          ? 3
          : energy == -2
          ? 2
          : energy <= -3
          ? 1
          : 10
        : energy == 1 || energy == 2
        ? 4
        : energy == 3
        ? 3
        : energy == 4
        ? 2
        : energy >= 5
        ? 1
        : 20;
  }

  calculate() {
    Object.keys(this.tileTypeIds).forEach((type) => {
      this.amount[type] = this.dataManager.get(`zones-${type}-count`);
    });

    const total = Object.values(this.amount).reduce(
      (value, sum) => sum + value,
      0
    );

    Object.keys(this.tileTypeIds).forEach((type) => {
      this.percentage[type] =
        total === 0
          ? this.idealPct[type]
          : this.dataManager.get(`zones-${type}-count`) / total;

      this.difference[type] = Math.min(
        (this.percentage[type] - this.idealPct[type]) / this.idealPct[type],
        1
      );
    });

    const type = "windTurbine"; // Added cause windTurbine is not listed in tiles.yml
    const subTypes = ["Small", "Big"];
    this.percentage[type] =
      total === 0
        ? this.idealPct[type]
        : (this.dataManager.get(`zones-${type}${subTypes[0]}-count`) +
            this.dataManager.get(`zones-${type}${subTypes[1]}-count`)) /
          total;

    this.difference[type] = Math.min(
      (this.percentage[type] - this.idealPct[type]) / this.idealPct[type],
      1
    );

    this.calculateIndex();
  }

  getGoals() {
    return [
      {
        id: "zone-balance-r-low",
        category: "zone-balance",
        priority: 1,
        condition:
          this.amount.residential >= this.underDevThreshold.residential,
        progress: this.goalProgress(
          1 + this.difference.residential,
          1 - this.acceptablePctDiff
        ),
      },
      {
        id: "zone-balance-e-low",
        category: "zone-balance",
        priority: 1,
        condition:
          this.amount.windTurbineSmall + this.amount.windTurbineBig * 2 >=
          this.amount.residential,
        progress: this.goalProgress(
          1 + this.difference.windTurbine,
          1 - this.acceptablePctDiff
        ),
      },
      {
        id: "zone-balance-r-high",
        category: "zone-balance",
        priority: 2,
        condition: this.amount.residential <= this.overDevThreshold.residential,
        progress: this.goalProgress(
          1 - this.difference.residential,
          1 - this.acceptablePctDiff
        ),
      },
      {
        id: "zone-balance-e-high",
        category: "zone-balance",
        priority: 2,
        condition:
          this.amount.windTurbineSmall + this.amount.windTurbineBig * 2 <=
          this.amount.residential,
        progress: this.goalProgress(
          1 - this.difference.windTurbine,
          1 - this.acceptablePctDiff
        ),
      },
    ];
  }
}

module.exports = ZoneBalanceData;
