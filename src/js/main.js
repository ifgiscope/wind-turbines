/* globals PIXI */
const yaml = require("js-yaml");
const CfgReaderFetch = require("./cfg-reader-fetch");
const CfgLoader = require("./cfg-loader");
const City = require("./city");
const MapEditor = require("./editor/map-editor");
const CarOverlay = require("./cars/car-overlay");
const TileCounterView = require("./tile-counter-view");
const TestScenarios = require("./test/scenarios");
const showFatalError = require("./lib/show-fatal-error");
require("../sass/default.scss");
require("../sass/desktop.scss");
//const ZoneBalanceView = require("./zone-balance-view");
const DataInspectorView = require("./data-inspector-view");
const VariableRankListView = require("./index-list-view");
//const PollutionData = require("./data-sources/pollution-data");
//const NoiseData = require("./data-sources/noise-data");
const GreenSpacesData = require("./data-sources/green-spaces-data");
const WindTurbinesData = require("./data-sources/wind-turbines-data_WT");
//const TravelTimesData = require("./data-sources/travel-times-data");
const ZoningData = require("./data-sources/zoning-data");
const ZoneBalanceData = require("./data-sources/zone-balance-data");
const GoalDebugView = require("./goal-debug-view");
const DataManager = require("./data-manager");
const CitizenRequestView = require("./citizen-request-view");
const CitizenRequestViewMgr = require("./citizen-request-view-mgr");
const TextureLoader = require("./texture-loader");
const CarSpawner = require("./cars/car-spawner");

const qs = new URLSearchParams(window.location.search);
const testScenario = qs.get("test") ? TestScenarios[qs.get("test")] : null;

const cfgLoader = new CfgLoader(CfgReaderFetch, yaml.load);
cfgLoader
  .load([
    "config/city.yml",
    "config/tiles.yml",
    "config/variables.yml",
    "config/goals.yml",
    "config/citizen-requests.yml",
    "config/dashboard.yml",
    "config/traffic.yml",
    "config/cars.yml",
    //"config/power-ups.yml",
    "config/default-settings.yml",
    "./settings.yml",
  ])
  .catch((err) => {
    showFatalError("Error loading configuration", err);
    console.error("Error loading configuration");
    console.error(err);
  })
  .then((config) => {
    const city =
      testScenario && testScenario.city
        ? City.fromJSON(testScenario.city)
        : new City(config.cityWidth, config.cityHeight);

    const stats = new DataManager();
    stats.registerSource(new ZoningData(city, config));
    stats.registerSource(new ZoneBalanceData(city, config));
    stats.registerSource(new GreenSpacesData(city, config));
    stats.registerSource(new WindTurbinesData(city, config));
    stats.calculateAll(); // Calculation gets done here once, because the cities default state is no longer only empty cells, but park cells. Therefore the tile count must be calculated here too, default 0 is no longer correct
    city.map.events.on("update", () => {
      stats.calculateAll();
    });

    const app = new PIXI.Application({
      width: 1920,
      height: 1920,
      backgroundColor: 0xf2f2f2,
    });

    const textureLoader = new TextureLoader(app);
    textureLoader.addSpritesheet("roads");
    textureLoader.addSpritesheet("roads-walkable");
    textureLoader.addSpritesheet("parks");
    textureLoader.addSpritesheet("water");
    textureLoader.addSpritesheet("windturbines_small");
    textureLoader.addSpritesheet("windturbines_big");
    textureLoader.addFolder("cars", CarSpawner.allTextureIds(config));
    textureLoader
      .load()
      .then((textures) => {
        $('[data-component="app-container"]').append(app.view);

        const mapEditor = new MapEditor(
          $(".fms-desktop"),
          city,
          config,
          textures,
          stats
        );
        app.stage.addChild(mapEditor.displayObject);
        mapEditor.displayObject.width = 1920;
        mapEditor.displayObject.height = 1920;
        mapEditor.displayObject.x = 0;
        mapEditor.displayObject.y = 0;
        app.ticker.add((time) => mapEditor.animate(time));

        const carOverlay = new CarOverlay(mapEditor.mapView, config, textures, {
          spawn: !testScenario,
          maxLifetime: !testScenario,
        });
        app.ticker.add((time) => carOverlay.animate(time));
        const carSpawner = new CarSpawner(carOverlay, config);
        if (!testScenario) {
          app.ticker.add((time) => carSpawner.animate(time));
        }

        const counterView = new TileCounterView(stats, config);
        //const zoneBalanceView = new ZoneBalanceView(stats, config);

        $("[data-component=counters]").append([
          counterView.$element,
          //zoneBalanceView.$element,
        ]);

        const dataInspectorView = new DataInspectorView();
        $("[data-component=dataInspector]").append(dataInspectorView.$element);
        mapEditor.events.on("inspect", (data) =>
          dataInspectorView.display(data)
        );

        const variables = {
          //"Travel times": "travel-times",
          // ADD HERE SOMETHING ABOUT ENERGY
          "Green space prox.": "green-spaces-proximity",
          "Green space areas": "green-spaces-areas",
          //"Pollution (all)": "pollution",
          //"Pollution (resid.)": "pollution-residential",
          //"Noise (all)": "noise",
          //"Noise (resid.)": "noise-residential",
        };

        const varSelector = $("<select></select>")
          .addClass(["form-control", "mr-2"])
          .append(
            Object.keys(variables).map((name) =>
              $("<option></option>").text(name).attr("value", name)
            )
          );

        $("<div></div>")
          .addClass(["form-inline", "mt-2"])
          .append(varSelector)
          .append(
            $("<button></button>")
              .attr("type", "button")
              .addClass(["btn", "btn-primary", "btn-sm"])
              .text("Calculate")
              .on("click", () => {
                const varName = varSelector.val();
                const varData =
                  typeof variables[varName] === "string"
                    ? stats.get(variables[varName])
                    : variables[varName].calculate();
                dataInspectorView.display({
                  title: varName,
                  values: varData,
                  fractional: Math.max(...varData) <= 1,
                });
              })
          )
          .appendTo($("[data-component=dataInspector]"));

        const variableRankListView = new VariableRankListView(config.variables);
        // Todo: Remove the lines below
        $('[data-component="status"]').append(variableRankListView.$element);
        variableRankListView.setValues({
          "green-spaces": 0, // 0 is neutral
        });
        window.variableRankListView = variableRankListView;

        const goalDebugView = new GoalDebugView(stats.getGoals());
        $('[data-component="goal-debug-container"]').append(
          goalDebugView.$element
        );

        let indexesDirty = true;
        let indexesCooldownTimer = null;
        const indexesCooldownTime = 1000;

        function recalculateIndexes() {
          indexesDirty = true;
          if (indexesCooldownTimer === null) {
            variableRankListView.setValues({
              "green-spaces": stats.get("green-spaces-index"),
              "wind-turbines": stats.get("wind-turbines-index"),
              distances: stats.get("distances-index"),
            });
            goalDebugView.setValues(stats.getGoals());
            indexesDirty = false;
            indexesCooldownTimer = setTimeout(() => {
              indexesCooldownTimer = null;
              if (indexesDirty) {
                recalculateIndexes();
              }
            }, indexesCooldownTime);
          }
        }

        stats.events.on("update", () => {
          recalculateIndexes();
        });
        recalculateIndexes();

        const citizenRequestView = new CitizenRequestView(config);
        $("[data-component=citizen-request-container]").append(
          citizenRequestView.$element
        );
        const citizenRequestViewMgr = new CitizenRequestViewMgr(
          citizenRequestView
        );
        citizenRequestViewMgr.handleUpdate(stats.getGoals());
        stats.events.on("update", () => {
          citizenRequestViewMgr.handleUpdate(stats.getGoals());
        });

        if (testScenario) {
          testScenario(city, carOverlay);
          if (!window.test) {
            window.test = {};
          }
          window.test.city = city;
          window.test.carOverlay = carOverlay;
          window.test.cars = carOverlay.cars;
        }
      })
      .catch((err) => {
        showFatalError("Error loading textures", err);
        console.error(err);
      });
  });
