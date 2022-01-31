# Map Colonies typescript script template

----------------------------------

![badge-alerts-lgtm](https://img.shields.io/lgtm/alerts/github/MapColonies/ts-script-boilerplate?style=for-the-badge)

![grade-badge-lgtm](https://img.shields.io/lgtm/grade/javascript/github/MapColonies/ts-script-boilerplate?style=for-the-badge)

![snyk](https://img.shields.io/snyk/vulnerabilities/github/MapColonies/ts-script-boilerplate?style=for-the-badge)

----------------------------------

This is a basic repo template for building new MapColonies cli script or cron-job in Typescript.

### Template Usage Notes:
- the docker file contains default command to use when running container without additional parameters
- command handlers can be async or sync functions
- naming command '$0' will make it the default command
### Template Features:

- eslint configuration by [@map-colonies/eslint-config](https://github.com/MapColonies/eslint-config)

- prettier configuration by [@map-colonies/prettier-config](https://github.com/MapColonies/prettier-config)

- jest

- .nvmrc

- Multi stage producton-ready Dockerfile

- commitlint

- git hooks

- logging by [@map-colonies/js-logger](https://github.com/MapColonies/js-logger)

- config load with [node-config](https://www.npmjs.com/package/node-config)

- Tracing and metrics by [@map-colonies/telemetry](https://github.com/MapColonies/telemetry)

- github templates

- bug report

- feature request

- pull request

- github actions

- on pull_request

- LGTM

- test

- lint

- snyk

## Installation

Install deps with npm

```bash
npm install
```
### Install Git Hooks
```bash
npx husky install
```

## Run Locally

Clone the project

```bash

git clone https://link-to-project

```

Go to the project directory

```bash

cd my-project

```

Install dependencies

```bash

npm install

```

Start the script

```bash

npm run start -- [parameter1] [parameter 2] [...]

```

## Running Tests

To run tests, run the following command

```bash

npm run test

```

To only run unit tests:
```bash
npm run test:unit
```

To only run integration tests:
```bash
npm run test:integration
```
