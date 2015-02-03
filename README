# air-quality-megaphone

A small Node.js app to gather air quality statistics and tweet it out.

## Overview

This is a small, two piece project that will:

 - fetch data from [aqicn.org](http://aqicn.org/map/world/) and, determine the 10 most polluted places, save them to a database and then tweet the results at [@earth_aq](https://twitter.com/earth_aq). This is currently happening every hour. 

 - provide a mechanism to generate statistics around the saved pollution data.

## Setting up your development environment
To set up the development environment for this app, you'll need to install the following on your system:

- [Node.js](http://nodejs.org/)

After these basic requirements are met, run the following commands in the root project folder:
```
$ npm install
```

You will need to set environment variables or otherwise hardcode them. In the stats.js case, these can be found in a .env file (since the app is meant to be run locally).
```
CONSUMER_KEY=foo (Twitter)
CONSUMER_SECRET=foo (Twitter)
TOKEN=foo (Twitter)
TOKEN_SECRET=foo (Twitter)
DATA_URL=http://foo.com (Data source)
MONGOLAB_URI=mongodb://foo.com (Mongo database)
```

This application is designed to be run on Heroku (but can easily be changed to 
work elsewhere). As such, it may be worth installing the Heroku [toolbelt](https://toolbelt.heroku.com/).

## Running the app
fetch.js is meant to be run on a schedule on Heroku and so isn't meant to be run locally (though it can be, be careful to disable tweeting). stats.js can be run locally to output statistics like below:

To start the app, run the following command in the root project folder.

```
$ node stats.js
```

or if using Heroku toolbelt:

```
$ foreman start stats
```

You should see output to your terminal window as well as a new file called **data.csv** that is in the project's root. **data.csv** is a CSV data dump (warning, this could get really large very quickly!).

## Future improvements
- Generate more statistics around the data
- Currently only saving 10 worst cities every hour, increase that (along with database capacity)

## Known issues

## Contribution guidelines

There are many ways to contribute to a project, below are some examples:

- Report bugs, ideas, requests for features by creating “Issues” in the project repository.

- Fork the code and play with it, whether you later choose to make a pull request or not.

- Create pull requests of changes that you think are laudatory. From typos to major design flaws, you will find a target-rich environment for improvements.

### Style
There is no set style for this project, but please try to match existing coding 
styles as closely as possible.

### Tests
Working on it.
