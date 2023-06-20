const DataSource = require("../data-source");
const { allDistancesToTileType } = require("../lib/distance");
const { getTileTypeId } = require("../lib/config-helpers");
const { regionAreas } = require("../lib/regions");

class WindTurbinesData extends DataSource {
  constructor(city, config) {
    super();
    this.city = city;
    this.config = config;

    this.index = 1; // Default is unhappy
  }

  getVariables() {
    return {
      "wind-turbines-index": () => this.index,
    };
  }

  calculate() {
    // TO DO
  }

  calculateIndex() {
    // TO DO
  }

  getGoals() {
    return [
      // TO DO
    ];
  }
}

module.exports = WindTurbinesData;
