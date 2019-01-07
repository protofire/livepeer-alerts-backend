/* eslint no-use-before-define: 0 */  // --> OFF

# Livepeer Backend Notifications

Provide pro-active alert notifications that will help LPT token holders to be updated and understand how the transcoders they are delegating the tokens to are performing in near real time

[![Build Status](https://api.travis-ci.org/protofire/livepeer-alerts-backend.svg?branch=master)](https://travis-ci.org/protofire/livepeer-alerts-backend)
[![Coverage Status](https://coveralls.io/repos/github/protofire/livepeer-alerts-backend/badge.svg?branch=master)](https://coveralls.io/github/protofire/livepeer-alerts-backend?branch=master)
[![contributions welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg?style=flat)](https://github.com/protofire/livepeer-alerts-backend/issues)
[![MIT licensed](https://img.shields.io/badge/license-MIT-blue.svg)](https://raw.githubusercontent.com/protofire/livepeer-alerts-backend/master/LICENSE)


### Demo

[API Live Version](https://livepeer-alerts-backend.herokuapp.com/)

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites
In order to develop livepeer-alerts-backend, you'll need:
```
- [Git](https://git-scm.com/) 
- [Node.js](https://nodejs.org/) >= 8.10.0
- [NPM](https://www.npmjs.com/) >= 5.6.0
- [MongoDB](https://www.mongodb.com/download-center/community) v4.0.4
- [Sendgrid API KEY] 
```


## Get Started
- To run server, simply execute ```$ npm run start```
- To run tests, simply execute ```$ npm run test```

Clone this repository and install npm dependencies:

```
1) git clone https://github.com/protofire/livepeer-alerts-backend.git
2) cd livepeer-alerts-backend
3) npm install
4) Copy ".env.example" and rename it as ".env"
5) Edit the ".env" file with your SEND_GRID_API_KEY and your MONGO_HOST_URL 
6) npm start
```

## Configuration
- Copy env example file to run in dev mode: ```$ cp .env.example .env ```


## Running the tests

```
1) On the project folder run "npm test"

```

## API

The API is described in details on the [API](https://github.com/protofire/livepeer-alerts-backend/blob/master/API.md) readme.

## Built With

* [NodeJS](https://nodejs.org) 
* [NPM](https://www.npmjs.com/) - Dependency Management
* [Web3](https://web3js.readthedocs.io/en/1.0/) - Ethereum JavaScript API
* [Express](http://expressjs.com/)
* [Livepeer SDK](https://github.com/livepeer/livepeerjs/tree/master/packages/sdk) - A module for interacting with Livepeer's smart contracts.
* [Mongoose](https://mongoosejs.com/) - MongoDB object modeling

## Contributing
Please read [CONTRIBUTING.md](https://github.com/protofire/livepeer-alerts-backend/blob/master/CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests to us.

## License

This project is licensed under the MIT License - see the [LICENSE.md](https://github.com/protofire/livepeer-alerts-backend/blob/master/LICENSE) file for details
