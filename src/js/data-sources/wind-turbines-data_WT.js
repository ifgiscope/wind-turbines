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
    this.proximitiesSmallWindTurbines = [];
    this.proximitiesBigWindTurbines = [];

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
    this.numWindTurbinesTooClose = 0;

    this.amountOfSmallWindTurbines = 0;
    this.amountOfBigWindTurbines = 0;

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

    const distancesResidential = allDistancesToTileType(this.city.map, [
      residentialId,
    ]);

    // COULD BE REMOVED
    const distancesWindTurbines = allDistancesToTileType(this.city.map, [
      windTurbineSmallId,
      windTurbineBigId,
    ]);
    console.log("distancesWindTurbines", distancesWindTurbines);

    // Distance between small wind turbines and water / roads
    this.proximitiesSmallWaterRoad = [];
    this.city.map.allCells().forEach(([x, y, tile]) => {
      if (tile === windTurbineSmallId) {
        this.proximitiesSmallWaterRoad.push(distancesWaterRoad[y][x]);
      }
    });
    // Distance between big wind turbines and water / roads
    this.proximitiesBigWaterRoad = [];
    this.city.map.allCells().forEach(([x, y, tile]) => {
      if (tile === windTurbineBigId) {
        this.proximitiesBigWaterRoad.push(distancesWaterRoad[y][x]);
      }
    });

    // Distance between small wind turbines and residentials
    this.proximitiesSmallResidential = [];
    this.city.map.allCells().forEach(([x, y, tile]) => {
      if (tile === windTurbineSmallId) {
        this.proximitiesSmallResidential.push(distancesResidential[y][x]);
      }
    });
    // Distance between big wind turbines and residentials
    this.proximitiesBigResidential = [];
    this.city.map.allCells().forEach(([x, y, tile]) => {
      if (tile === windTurbineBigId) {
        this.proximitiesBigResidential.push(distancesResidential[y][x]);
      }
    });

    this.proximitiesSmallWindTurbines = [];
    this.proximitiesBigWindTurbines = [];
    this.city.map.allCells().forEach(([x, y, tile]) => {
      if (tile === windTurbineSmallId) {
        console.log(
          distancesWindTurbines[y - 1][x - 1],
          distancesWindTurbines[y - 1][x],
          distancesWindTurbines[y - 1][x + 1]
        );
        console.log(
          distancesWindTurbines[y][x - 1],
          distancesWindTurbines[y][x],
          distancesWindTurbines[y][x + 1]
        );
        console.log(
          distancesWindTurbines[y + 1][x - 1],
          distancesWindTurbines[y + 1][x],
          distancesWindTurbines[y + 1][x + 1]
        );
        if (
          !(
            distancesWindTurbines[y - 1][x - 1] == 2 &&
            distancesWindTurbines[y - 1][x] == 1 &&
            distancesWindTurbines[y - 1][x + 1] == 2
          ) &&
          !(
            distancesWindTurbines[y][x - 1] == 1 &&
            distancesWindTurbines[y][x] == 0 &&
            distancesWindTurbines[y][x + 1] == 1
          ) &&
          !(
            distancesWindTurbines[y + 1][x - 1] == 2 &&
            distancesWindTurbines[y + 1][x] == 1 &&
            distancesWindTurbines[y + 1][x + 1] == 2
          )
        ) {
          console.log("DDDD");
          this.proximitiesSmallWindTurbines.push(distancesWindTurbines[y][x]); // Residential distances are the same for big turbines
        }
      }
      /*if (tile === windTurbineBigId) {
        this.proximitiesBigWindTurbines.push(distancesWindTurbines[y][x]);
      }*/
    });
    console.log(
      "proximitiesSmallWindTurbines",
      this.proximitiesSmallWindTurbines
    );
    /*console.log(
      "this.proximitiesBigWindTurbines",
      this.proximitiesBigWindTurbines
    );
    console.log(
      "proximitiesSmallWindTurbines",
      this.proximitiesSmallWindTurbines
    );*/

    // count how many small wind turbines are part of city
    /*this.amountOfSmallWindTurbines = 0;
    this.city.map.allCells().forEach(([x, y, tile]) => {
      if (tile === windTurbineSmallId) {
        this.amountOfSmallWindTurbines += 1; // Residential distances are the same for big turbines
      }
    });*/
    //console.log("small turbines", this.amountOfSmallWindTurbines);
    // count how many small wind turbines are part of city
    /*this.amountOfBigWindTurbines = 0;
    this.city.map.allCells().forEach(([x, y, tile]) => {
      if (tile === windTurbineBigId) {
        this.amountOfBigWindTurbines += 1; // Residential distances are the same for big turbines
      }
    });*/
    //console.log("big turbines", this.amountOfBigWindTurbines);
  }

  calculate() {
    this.calculateProximities();
    this.calculateIndex();
  }

  calculateIndex() {
    this.numResidentialsTooClose = 0;
    this.numWaterRoadsTooClose = 0;
    this.numWindTurbinesTooClose = 0;

    this.proximitiesSmallWaterRoad.forEach((distance) => {
      if (distance <= this.wtSmallWaterRoadsDist) {
        this.numWaterRoadsTooClose += 1;
      }
    });
    this.proximitiesBigWaterRoad.forEach((distance) => {
      if (distance <= this.wtBigWaterRoadsDist) {
        this.numWaterRoadsTooClose += 1;
      }
    });

    this.proximitiesSmallResidential.forEach((distance) => {
      if (distance <= this.wtSmallResidentialsDist) {
        this.numResidentialsTooClose += 1;
      }
    });
    this.proximitiesBigResidential.forEach((distance) => {
      if (distance <= this.wtBigResidentialsDist) {
        this.numResidentialsTooClose += 1;
      }
    });

    this.numWindTurbinesTooClose =
      this.proximitiesSmallWindTurbines.length +
      this.proximitiesBigWindTurbines.length;

    console.log("numWindTurbinesTooClose", this.numWindTurbinesTooClose);
  }

  getGoals() {
    return [
      {
        id: "wind-turbine-distance-road-water-low",
        category: "distance",
        priority: 1,
        condition: this.numWaterRoadsTooClose == 0, //this.stats.get("zones-"),
        progress: this.goalProgress(this.numWaterRoadsTooClose, 0),
      },
      {
        id: "wind-turbine-distance-residential-low",
        category: "distance",
        priority: 1,
        condition: this.numResidentialsTooClose == 0,
        progress: this.goalProgress(this.numResidentialsTooClose, 0),
      },
      {
        id: "wind-turbine-distance-wind-turbines-low",
        category: "distance",
        priority: 1,
        condition: this.numWindTurbinesTooClose == 0,
        //this.numWindTurbinesTooClose <= 1,
        // MAYBE A DISTANCE TO NEXT WT FUNCTION HAS TO BE IMPLEMENTED
        //this.amountOfSmallWindTurbines + this.amountOfBigWindTurbines, // Nicht 1, sondern die anzahl der platzierten wind energieanlagen
        progress: this.goalProgress(
          this.numWindTurbinesTooClose,
          0
          //this.amountOfSmallWindTurbines + this.amountOfBigWindTurbines
        ),
      },
    ];
  }
}

module.exports = WindTurbinesData;
