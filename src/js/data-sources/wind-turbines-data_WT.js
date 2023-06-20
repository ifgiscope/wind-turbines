const DataSource = require("../data-source");
const { allDistancesToTileType } = require("../lib/distance");
const { getTileTypeId } = require("../lib/config-helpers");
//const { regionAreas } = require("../lib/regions");

class WindTurbinesData extends DataSource {
  constructor(city, config) {
    super();
    this.city = city;
    this.config = config;

    this.proximitiesSmallWaterRoad = [];
    this.proximitiesBigWaterRoad = [];
    this.proximitiesSmallResidential = [];
    this.proximitiesBigResidential = [];

    this.wtSmallWaterRoadsDist =
      this.config.goals["distances"]["windTurbineSmall-distance-water-roads"] ||
      1;
    this.wtSmallResidentialsDist =
      this.config.goals["distances"][
        "windTurbineSmall-distance-residentials"
      ] || 2;

    this.wtBigWaterRoadsDist =
      this.config.goals["distances"]["windTurbineBig-distance-water-roads"] ||
      2;
    this.wtBigResidentialsDist =
      this.config.goals["distances"]["windTurbineBig-distance-residentials"] ||
      3;

    this.numWaterRoadsTooClose = 0;
    this.numResidentialsTooClose = 0;

    this.index = 1; // Default is unhappy
    this.distancesIndex = 5;
  }

  getVariables() {
    return {
      "wind-turbines-index": () => this.index,
      "distances-index": () => this.distancesIndex,
    };
  }

  calculateProximities() {
    const residentialId = getTileTypeId(this.config, "residential");
    const waterTileId = getTileTypeId(this.config, "water");
    const roadTileId = getTileTypeId(this.config, "road");
    const windTurbineSmallId = getTileTypeId(this.config, "windTurbineSmall");
    const windTurbineBigId = getTileTypeId(this.config, "windTurbineBig");
    const distancesWaterRoad = allDistancesToTileType(this.city.map, [
      waterTileId,
      roadTileId,
    ]);
    //console.log(distancesWaterRoad);

    const distancesResidential = allDistancesToTileType(this.city.map, [
      residentialId,
    ]);
    //console.log(distancesResidential);

    this.proximitiesSmallWaterRoad = [];
    this.city.map.allCells().forEach(([x, y, tile]) => {
      if (tile === windTurbineSmallId) {
        this.proximitiesSmallWaterRoad.push(distancesWaterRoad[y][x]);
      }
    });
    this.proximitiesBigWaterRoad = [];
    this.city.map.allCells().forEach(([x, y, tile]) => {
      if (tile === windTurbineBigId) {
        this.proximitiesBigWaterRoad.push(distancesWaterRoad[y][x]);
      }
    });

    this.proximitiesSmallResidential = [];
    this.city.map.allCells().forEach(([x, y, tile]) => {
      if (tile === windTurbineSmallId) {
        this.proximitiesSmallResidential.push(distancesResidential[y][x]);
      }
    });
    this.proximitiesBigResidential = [];
    this.city.map.allCells().forEach(([x, y, tile]) => {
      if (tile === windTurbineBigId) {
        this.proximitiesBigResidential.push(distancesResidential[y][x]);
      }
    });
  }

  calculate() {
    this.calculateProximities();
    this.calculateIndex();
  }

  calculateIndex() {
    const residentialId = getTileTypeId(this.config, "residential");
    const waterTileId = getTileTypeId(this.config, "water");
    const roadTileId = getTileTypeId(this.config, "road");
    const windTurbineSmallId = getTileTypeId(this.config, "windTurbineSmall");
    const windTurbineBigId = getTileTypeId(this.config, "windTurbineBig");

    this.numResidentialsTooClose = 0;
    this.numWaterRoadsTooClose = 0;

    this.proximitiesSmallWaterRoad.forEach((distance) => {
      if (distance < this.wtSmallWaterRoadsDist) {
        this.numWaterRoadsTooClose += 1;
      }
    });
    this.proximitiesBigWaterRoad.forEach((distance) => {
      if (distance < this.wtBigWaterRoadsDist) {
        this.numWaterRoadsTooClose += 1;
      }
    });

    this.proximitiesSmallResidential.forEach((distance) => {
      if (distance < this.wtSmallResidentialsDist) {
        this.numResidentialsTooClose += 1;
      }
    });
    this.proximitiesBigResidential.forEach((distance) => {
      if (distance < this.wtBigResidentialsDist) {
        this.numResidentialsTooClose += 1;
      }
    });

    console.log("this.numResidentialsTooClose", this.numResidentialsTooClose);
    console.log("numWaterRoadsTooClose", this.numWaterRoadsTooClose);
  }

  getGoals() {
    return [
      {
        id: "wind-turbine-distance-road-water-low",
        category: "distance",
        priority: 1,
        condition: this.numWaterRoadsTooClose == 0,
        progress: this.goalProgress(this.numWaterRoadsTooClose, 0),
      },
      {
        id: "wind-turbine-distance-residential-low",
        category: "distance",
        priority: 1,
        condition: this.numResidentialsTooClose == 0,
        progress: this.goalProgress(this.numResidentialsTooClose, 0),
      },
    ];
  }
}

module.exports = WindTurbinesData;
