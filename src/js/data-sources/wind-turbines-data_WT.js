const DataSource = require("../data-source");
const { allDistancesToTileType } = require("../lib/distance");
const { getTileTypeId } = require("../lib/config-helpers");
//const { regionAreas } = require("../lib/regions");

class WindTurbinesData extends DataSource {
  constructor(city, config) {
    super();
    this.city = city;
    this.config = config;

    // This arrays will contain a 16 x 16 raster of the distance values from any raster cell to
    // and other data types (water, road, residential area, wind turbines small and big).
    this.proximitiesSmallWaterRoad = [];
    this.proximitiesBigWaterRoad = [];
    this.proximitiesSmallResidential = [];
    this.proximitiesBigResidential = [];
    this.proximitiesSmallWindTurbines = [];
    this.proximitiesBigWindTurbines = [];

    // The following variable will contain the distances that have to be kept and are written down in config/goals.yml
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

    // The following values are counters, that are initially set to 0
    this.numWaterRoadsTooClose = 0;
    this.numWaterRoadsTooCloseWithGoodwill = 0;
    this.numResidentialsTooClose = 0;
    this.numResidentialsTooCloseWithGoodwill = 0;
    this.numWindTurbinesTooClose = 0;

    this.amountOfSmallWindTurbines = 0;
    this.amountOfBigWindTurbines = 0;
    this.amountOfWindTurbines = 0;

    // This index will be used e.g. for choosing the correct smiley and citizen requests
    // for distance constraints. 5 is the default value, it says "happy"
    this.distancesIndex = 5;
  }

  /**
   * Getter for the distance index.
   * return: Distance index variable
   */
  getVariables() {
    return {
      "distances-index": () => this.distancesIndex,
    };
  }

  /**
   * This function checks the distance values of a distances 2D array in a given window.
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
            continue;
          }
        }
      }
      return true;
    } else {
      return false;
    }
  }

  /**
   * This function gets used to fill the proximity arrays.
   */
  calculateProximities() {
    const residentialId = getTileTypeId(this.config, "residential");
    const waterTileId = getTileTypeId(this.config, "water");
    const roadTileId = getTileTypeId(this.config, "road");
    const windTurbineSmallId = getTileTypeId(this.config, "windTurbineSmall");
    const windTurbineBigId = getTileTypeId(this.config, "windTurbineBig");

    // The following lines will build the distances arrays:
    const distancesWaterRoad = allDistancesToTileType(this.city.map, [
      waterTileId,
      roadTileId,
    ]);

    const distancesResidential = allDistancesToTileType(this.city.map, [
      residentialId,
    ]);

    const distancesWindTurbines = allDistancesToTileType(this.city.map, [
      windTurbineSmallId,
      windTurbineBigId,
    ]);

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
        this.proximitiesSmallWindTurbines.push(
          this.calculateBuffer(distancesWindTurbines, x, y, 1, [
            [1, 1, 1],
            [1, 0, 1],
            [1, 1, 1],
          ])
        );
      }

      if (tile === windTurbineBigId) {
        this.proximitiesBigWindTurbines.push(
          this.calculateBuffer(distancesWindTurbines, x, y, 2, [
            [1, 1, 1, 1, 1],
            [1, 2, 1, 2, 1],
            [1, 1, 0, 1, 1],
            [1, 2, 1, 2, 1],
            [1, 1, 1, 1, 1],
          ])
        );
      }
    });
  }

  // Just a call for the calculation done by other functions.
  calculate() {
    this.calculateProximities();
    this.calculateIndex();
  }

  //
  calculateIndex() {
    this.numResidentialsTooCloseWithGoodwill = 0;
    this.numResidentialsTooClose = 0;
    this.numWaterRoadsTooCloseWithGoodwill = 0;
    this.numWaterRoadsTooClose = 0;
    this.numWindTurbinesTooClose = false;

    this.proximitiesSmallWaterRoad.forEach((distance) => {
      if (distance <= this.wtSmallWaterRoadsDist) {
        // distance <= 1
        if (this.wtSmallWaterRoadsDist > 1) {
          // FALSE
          if (distance == this.wtSmallWaterRoadsDist) {
            // distance == 1
            this.numWaterRoadsTooCloseWithGoodwill += 1;
          } else {
            // distance < 2
            this.numWaterRoadsTooClose += 1;
          }
        } else {
          this.numWaterRoadsTooClose += 1;
        }
        this.numWaterRoadsTooClose += 1;
      }
    });
    // Goal: > 2; Goodwill: == 2; Bad: <= 2-1
    this.proximitiesBigWaterRoad.forEach((distance) => {
      if (distance <= this.wtBigWaterRoadsDist) {
        // distance <= 2
        if (this.wtBigWaterRoadsDist > 1) {
          if (distance == this.wtBigWaterRoadsDist) {
            // distance == 2
            this.numWaterRoadsTooCloseWithGoodwill += 1;
          } else {
            // distance < 2
            this.numWaterRoadsTooClose += 1;
          }
        } else {
          this.numWaterRoadsTooClose += 1;
        }
      }
    });

    this.proximitiesSmallResidential.forEach((distance) => {
      if (distance <= this.wtSmallResidentialsDist) {
        // distance <= 2
        if (this.wtSmallResidentialsDist > 1) {
          if (distance == this.wtSmallResidentialsDist) {
            // distance == 2
            this.numResidentialsTooCloseWithGoodwill += 1;
          } else {
            // distance < 2
            this.numResidentialsTooClose += 1;
          }
        } else {
          this.numResidentialsTooClose += 1;
        }
      }
    });
    this.proximitiesBigResidential.forEach((distance) => {
      // In case the amount of big wind turbines that are closer or equal to a fixed value (3)
      // is bigger than than, it will be differentiated, if it is equal or higher than the same
      // fixed value (3).
      // If it is equal, it will counted as only one violation which will be counted as "acceptable with goodwill".
      if (distance <= this.wtBigResidentialsDist) {
        // distance <= 3
        if (this.wtBigResidentialsDist > 1) {
          if (distance == this.wtBigResidentialsDist) {
            // distance == 3
            this.numResidentialsTooCloseWithGoodwill += 1;
          } else {
            // distance < 3
            this.numResidentialsTooClose += 1;
          }
        } else {
          this.numResidentialsTooClose += 1;
        }
      }
    });

    if (
      this.proximitiesSmallWindTurbines.includes(false) ||
      this.proximitiesBigWindTurbines.includes(false)
    ) {
      this.numWindTurbinesTooClose = true;
    }

    // 5 := best; 3 := neutral; 1 := worst; 0 := neutral
    this.distancesIndex =
      5 -
      this.numResidentialsTooCloseWithGoodwill -
      this.numWaterRoadsTooCloseWithGoodwill -
      (this.numResidentialsTooClose > 0 ? 4 : 0) -
      (this.numWaterRoadsTooClose > 0 ? 4 : 0) -
      (this.numWindTurbinesTooClose == true ? 4 : 0);
    // In case the index value falls below 1, it has to be corrected to 1 because 0 is neutral, 1 ist worst
    this.distancesIndex = this.distancesIndex <= 0 ? 1 : this.distancesIndex;
  }

  /**
   * This function contains the different goals and its conditions that will be checked and use the previous calculations as a basis.
   * @returns goals thats condition is false
   */
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
      {
        id: "wind-turbine-distance-wind-turbines-low",
        category: "distance",
        priority: 1,
        condition: this.numWindTurbinesTooClose == false,
        progress: this.goalProgress(this.numWindTurbinesTooClose, false),
      },
    ];
  }
}

module.exports = WindTurbinesData;
