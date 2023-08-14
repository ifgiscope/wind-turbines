# ifgi scope

A collaborative and interactive wind farm simulator. This project was done during the summer semester 2023 at ifgi.

This project is based on the existing [future mobility project from Imaginary ]([url](https://github.com/IMAGINARY/future-mobility)) and adapted it towards the aim of this project.
It consists of multiple components, which will be explained in the following.

## Website
The website allows users to arrange a 16x16 grid with certain areas. These areas include green spaces as water areas and parks, infrastructure as roads and residentials and windturbines of two different sizes. The initial layout is all parks as you can see in the following image:
<img width="1145" alt="Bildschirmfoto 2023-08-12 um 19 41 54" src="https://github.com/ifgiscope/wind-turbines/assets/61976072/7bf2aa67-74f1-4ab0-b20c-b83af037b83d">


With the buttons on the right the user can select an area type and then change tiles by clicking on them. Right to the grid are smileys that display how satisfied certain conditions are, the amount of green spaces, the amount of wind turbines and the distances towards one another. 
![image](https://github.com/ifgiscope/wind-turbines/assets/46593824/a94634a1-71ac-4406-a474-74ff8e88c408)

Below the smileys are acteurs displayed, that tell, when some conditions are true. They tell the user what is missing in the current layout. On example for this are citizens that say there is not enoug elecrticity. Therefore, there needs to be build more wind turbines. 
![image](https://github.com/ifgiscope/wind-turbines/assets/46593824/6039f364-5388-416a-9d72-7594a5a0a240)

Together with all these options, the user has the goal, to build the best possible layout to fulfill all goals and leave averyone involved satisfied.


## Compilation

To install the required dependencies run `npm install` in **both** the root directory and the
`server` directory.

You can use `npm run build` or `npm run watch` in the root directory to build the client apps. The
server does not require compilation.

The `.env` file in the root directory contains settings that are applied at compilation time.

## Running

Start the server by running `npm run start` in the `server` directory.

Start the frontend by running `http-server -c-1` in the root directory.
The clients, in the root directory, are:

- `city.html`: Presents the city map, to be projected over the exhibition table.
- `dashboard.html`: Shows the auxiliary touchscreen dashboard that displays variables and goals,
  and allows selecting Power-Ups.
- `editor.html`: An editor that pushes changes to the server. Note that it doesn't read updates from
  the server, so it's not possible to use multiple editors simulatenously. It's only meant for
  use during development.

## Configuration

The main configuration file is `config.yml`. The server has to be reloaded after any changes.
Clients get the configuration from the server through the http API and have to be reloaded after
the server to take any changes.

The .env file has other configuration keys that affect the environment.

## Server APIs

The server has both an HTTP and a WebSocket API. Their specifications are:

- http: `specs/openapi.yaml`
- ws: `specs/asyncapi.yaml`

You can use [Swagger Editor](https://editor.swagger.io/) and the
[AsyncAPI Playground](https://playground.asyncapi.io/) to format the respective specifications in
a friendly format.

## References

Some icons are used from [Flaticon]([url](https://www.flaticon.com/)). 


## License

Copyright (c) 2021 IMAGINARY gGmbH
Licensed under the MIT license (see LICENSE)
Supported by Futurium gGmbH
