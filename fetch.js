'use strict';

var request = require('request');
var Twitter = require('node-twitter');
var moment = require('moment');
var MongoClient = require('mongodb').MongoClient;

var numberToDisplay = 10;
var tweetDelay = 30000;
var maxRetries = 10;
var retries = 0;

// Set up Twitter
var twitterRestClient = new Twitter.RestClient(
    process.env.CONSUMER_KEY,
    process.env.CONSUMER_SECRET,
    process.env.TOKEN,
    process.env.TOKEN_SECRET
);

// Sanitize things because I hate Twitter
String.prototype.toTwitterString = function () {
  var tmp = this;
  tmp = tmp.replace( /\(/g, '[' );
  tmp = tmp.replace( /\)/g, ']' );
  tmp = tmp.replace( /'/g, '\u0027' );
  tmp = tmp.replace('\'', '\u0027' );
  return tmp;
}; 

// Grab the json object from the page source, nifty huh?
var extractData = function (data) {
  var beginIndex = data.indexOf('mapInitWithData(') + 16;
  var endIndex = data.indexOf('); }', beginIndex);

  var extract = data.substring(beginIndex, endIndex);

  var parsed;
  try {
    parsed = JSON.parse(extract);
    return parsed;
  }
  catch (err) {
    console.log('/// Parse Error ///');
    return parsed;
  }
};

// Make a Google Maps URL
var createMapString = function (station) {
  return 'https://www.google.com/maps/place/' + station.g[0] + '+' +
              station.g[1] + '/@' + station.g[0] + ',' + station.g[1] + ',5z';
};

// String for locations
var secondaryTwitterString = function (index, station, date) {
  return (index + 1).toString() +'. ' + station.city + ': AQI = ' +
                station.aqi + ' at ' + date + ', located at ' +
                createMapString(station);
};

// First tweet string
var primaryTwitterString = function (numberOfStations) {
  return 'Here is this hour\u2019s Top ' + numberToDisplay +
          ' list of #airpollution locations out' +
          ' of ' + numberOfStations + ' in the world:';
};

// Send it to Twitter
var sendToTwitter = function (status) {
  twitterRestClient.statusesUpdate({'status': status}, 
    function(err) {
      if (err) {
          console.log('Error: ' + (err.code ? err.code + ' ' +
                        err.message : err.message));
      }
    });
};

// Make list of statuses to send out, then send them
var tweetIt = function (numberOfStations, stations) {
  var statuses = [];
  var msg = primaryTwitterString(numberOfStations);
  statuses.push(msg);

  var date = moment().utc().format('D/MM/YY HH:mm UTC');
  for (var i = stations.length - 1; i >= 0; i--) {
    msg = secondaryTwitterString(i, stations[i], date);
    msg = msg.toTwitterString();
    statuses.push(msg);
  }

  var interval = setInterval(function () {
    var m = statuses.shift();
    if (!m) {
      console.log('--- Finished Tweeting ---');
      return clearInterval(interval);
    }
    console.log(m);
    sendToTwitter(m);
  }, tweetDelay);
};

// Save to a mongo instance
var saveToDatabase= function (data, cb) {
  // Connect to db
  MongoClient.connect(process.env.MONGOLAB_URI, function(err, db) {
    if (err) {
      cb(err);
    }

    // Preapre data for saving
    var fetchDate = new Date();
    for (var i = 0; i < data.length; i++) {
      data[i].position = i + 1;
      data[i].fetchDate = fetchDate;
    }

    // Get the collection
    var collection = db.collection('measurements');
    // Insert some data
    collection.insert(data, function(err) {
      cb(err);
    });
  });
};

// Do everything we could ever wish for
var fetchData = function () {
  console.log('--- Fetching data ---');
  var options = {
    'url': process.env.DATA_URL,
    'timeout': 30000,
    'encoding': 'utf-8'
  };
  request.get(options, function (err, res, body) {
    if (err) {
      return console.log(err);
    }

    console.log('--- Received data ---');
    console.log('--- Extracting data ---');

    // Extract it
    var json = extractData(body);

    // Sometimes we don't get the data on the page load, who knows why?
    // If we don't, try again after a delay until we try too many times.
    if (json) {
      var numberOfStations = json.length;

      console.log('--- Removing bad entries ---');

      // Remove no value entries
      var numberOfRemoved = 0;
      for (var i = json.length - 1; i >= 0; i--) {
        if (json[i].aqi === '-') {
          numberOfRemoved++;
          json.splice(i, 1);
        }
      }

      console.log('--- Removed ' + numberOfRemoved + ' stations ---');
      console.log('--- Sorting by highest AQI ---');

      // Sort it
      json.sort(function (a, b) {
        return b.aqi - a.aqi;
      });

      console.log('--- Save to database ---');
      var topStations = json.splice(0, numberToDisplay);
      saveToDatabase(topStations, function (err) {
        if (err) {
          return console.log(err);
        }
        console.log('--- Save to database complete ---');
        console.log('--- Sending to Twitter ---');

        // Tweet it
        tweetIt(numberOfStations, topStations);
      });
    } else {
      retries++;
      if (retries >= maxRetries) {
        return console.log('/// Max retries reached ///');
      }
      setTimeout(function () {
        fetchData();
      }, 30000);
    }
  });
};
fetchData();