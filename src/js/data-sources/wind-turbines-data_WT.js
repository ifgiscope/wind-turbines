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
    this.proximitiesSmallWindTurbines = 0;
    this.proximitiesBigWindTurbines = 0;

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
    this.amountOfWindTurbines = 0;

    this.index = 1; // Default is unhappy
    this.distancesIndex = 5;
  }

  getVariables() {
    return {
      "wind-turbines-index": () => this.index,
      "distances-index": () => this.distancesIndex,
    };
  }

  /**
   * distancesArray: array with shape a x b, containing distances from object to others
   * x: integer value representing the x position
   * y: integer value representing the y position
   * buffer: integer value representing a symmetrical buffer around (x,y)
   * xyWindow: [[integer]] 2D array, representing the values, the window should have, with size [2*buffer+1][2*buffer+2]
   * return: Boolean (true := no distortion in buffer, false := there is a distortion)
   */
  calculateBuffer(distancesArray, x, y, buffer, xyWindow) {
    if ((xyWindow.length + 1) / 2 - 1 == buffer) {
      // checks if buffer size and window size are matching
      for (let i = 0; i < xyWindow.length; i++) {
        for (let j = 0; j < xyWindow[0].length; j++) {
          const newX = x - buffer + i;
          const newY = y - buffer + j;
          if (
            newX >= 0 &&
            newX < distancesArray.length &&
            newY >= 0 &&
            newY < distancesArray.length
          ) {
            if (distancesArray[newY][newX] >= xyWindow[i][j]) {
              continue;
            } else {
              return false;
            }
          } else {
            break;
          }
        }
      }
      return true;
    } else {
      return false;
    }
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

    this.proximitiesSmallWindTurbines = true;
    this.proximitiesBigWindTurbines = true;
    this.city.map.allCells().forEach(([x, y, tile]) => {
      if (tile === windTurbineSmallId) {
        /*console.log(
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
        console.log(
          "proximitiesSmallWindTurbines",
          this.calculateBuffer(distancesWindTurbines, x, y, 1, [
            [1, 1, 1],
            [1, 0, 1],
            [1, 1, 1],
          ])
        );*/
        this.proximitiesSmallWindTurbines = this.calculateBuffer(
          distancesWindTurbines,
          x,
          y,
          1,
          [
            [1, 1, 1],
            [1, 0, 1],
            [1, 1, 1],
          ]
        );
      }
      if (tile === windTurbineBigId) {
        /*console.log(
          distancesWindTurbines[y - 2][x - 2],
          distancesWindTurbines[y - 2][x - 1],
          distancesWindTurbines[y - 2][x],
          distancesWindTurbines[y - 2][x + 1],
          distancesWindTurbines[y - 2][x + 2]
        );
        console.log(
          distancesWindTurbines[y - 1][x - 2],
          distancesWindTurbines[y - 1][x - 1],
          distancesWindTurbines[y - 1][x],
          distancesWindTurbines[y - 1][x + 1],
          distancesWindTurbines[y - 1][x + 2]
        );
        console.log(
          distancesWindTurbines[y][x - 2],
          distancesWindTurbines[y][x - 1],
          distancesWindTurbines[y][x],
          distancesWindTurbines[y][x + 1],
          distancesWindTurbines[y][x + 2]
        );
        console.log(
          distancesWindTurbines[y + 1][x - 2],
          distancesWindTurbines[y + 1][x - 1],
          distancesWindTurbines[y + 1][x],
          distancesWindTurbines[y + 1][x + 1],
          distancesWindTurbines[y + 1][x + 2]
        );
        console.log(
          distancesWindTurbines[y + 2][x - 2],
          distancesWindTurbines[y + 2][x - 1],
          distancesWindTurbines[y + 2][x],
          distancesWindTurbines[y + 2][x + 1],
          distancesWindTurbines[y + 2][x + 2]
        );
        console.log(
          "proximitiesBigWindTurbines",
          this.calculateBuffer(distancesWindTurbines, x, y, 2, [
            [1, 1, 1, 1, 1],
            [1, 2, 1, 2, 1],
            [1, 1, 0, 1, 1],
            [1, 2, 1, 2, 1],
            [1, 1, 1, 1, 1],
          ])
        );*/
        this.proximitiesBigWindTurbines = this.calculateBuffer(
          distancesWindTurbines,
          x,
          y,
          2,
          [
            [1, 1, 1, 1, 1],
            [1, 2, 1, 2, 1],
            [1, 1, 0, 1, 1],
            [1, 2, 1, 2, 1],
            [1, 1, 1, 1, 1],
          ]
        );
      }
    });
  }

  calculate() {
    this.calculateProximities();
    this.calculateIndex();
  }

  calculateIndex() {
    this.numResidentialsTooClose = 0;
    this.numWaterRoadsTooClose = 0;
    this.numWindTurbinesTooClose = true;

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
    console.log(
      "this.proximitiesSmallWindTurbines",
      this.proximitiesSmallWindTurbines
    );
    console.log(
      "this.proximitiesBigWindTurbines",
      this.proximitiesBigWindTurbines
    );
    this.numWindTurbinesTooClose =
      this.proximitiesSmallWindTurbines == false ||
      this.proximitiesBigWindTurbines == false
        ? false
        : true;
    //this.proximitiesSmallWindTurbines.length +
    //this.proximitiesBigWindTurbines.length; // -
    //this.amountOfWindTurbines;

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
        condition: this.numWindTurbinesTooClose == true,
        progress: this.goalProgress(this.numWindTurbinesTooClose, true),
      },
    ];
  }
}

module.exports = WindTurbinesData;
