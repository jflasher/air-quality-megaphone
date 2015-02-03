'use strict';

var MongoClient = require('mongodb').MongoClient;
var json2csv = require('json2csv');
var fs = require('fs');
var env = require('node-env-file');
var async = require('async');

// Read in env variables in a try block in case it fails (like when deploy)
try {
  env('.env');
} catch (e) {
  console.log('/// Could not read in .env ///');
}

var collection;
var database;
var initDB = function (cb) {
  MongoClient.connect(process.env.MONGOLAB_URI, function(err, db) {
    database = db;
    if (err) {
      cb(err);
    }

    // Get the collection
    collection = db.collection('measurements');
    cb(null);
  });
};

// Get data
var fetchData= function (cb) {
  console.log('--- Fetching data from DB ---');
  // Insert some data
  collection.find({}).toArray(function(err, result) {
    cb(err, result);
  });
};

var outputData = function (data, callback) {
  console.log('--- Generating CSV from JSON ---');
  json2csv({data: data, fields: ['city', 'aqi', 'position', 'fetchDate', 'g']},
    function (err, csv) {
    if (err) {
      callback(err);
    }
    fs.writeFile('data.csv', csv, function(err) {
        if (err) {
            return console.log(err);
        }

        console.log('--- Data file written to data.csv ---');
        callback(null, { 'written': true });
    });
  });
};

var outputStats = function (data, callback) {
  console.log('--- Running stats ---');

  // Number of uniques
  var counts = {};
  for (var i = 0; i < data.length; i++) {
    if (data[i].city in counts) {
      counts[data[i].city]++;
    } else {
      counts[data[i].city] = 1;
    }
  }
  // Sort them by occurence rate
  var countsArr = [];
  for (var key in counts) {
    countsArr.push({ 'city': key, 'value': counts[key] });
  }
  countsArr.sort(function (a, b) {
    return b.value - a.value;
  });

  // Number of time periods
  var numberOfTimePeriods = 0;
  var periods = {};
  for (i = 0; i < data.length; i++) {
    if ((data[i].fetchDate in periods) === false) {
      numberOfTimePeriods++;
      periods[data[i].fetchDate] = true;
    }
  }

  console.log('--- Finished running stats ---');
  var stats = {
    'counts': countsArr,
    'numberOfTimePeriods': numberOfTimePeriods
  };
  callback(null, stats);
};

var runOutputs = function (err, data) {
  if (err) {
    return console.log(err);
  }

  console.log('--- Recieved data, generating outputs in parallel!---');
  async.parallel([
      function (callback) {
          outputData(data, callback);
      },
      function(callback){
          outputStats(data, callback);
      }
  ],
  function(err, results) {
      if (err) {
        console.log(err);
      }
      database.close();

      // Output results
      console.log('\n');
      console.log('////////////////////');
      console.log('// Stats!');
      console.log('////////////////////');
      console.log('\n- Unique Stations and Times They Appear (out of ' +
        results[1].numberOfTimePeriods + ' fetches)');
      var numberOfStations = results[1].counts.length;
      for (var i = 0; i < numberOfStations; i++) {
        console.log(results[1].counts[i].city + ': ' +
          results[1].counts[i].value);
      }
      console.log('\n- Number of Unique Stations');
      console.log(numberOfStations);
  });
};

// Kick it off
initDB(function (err) {
  console.log('--- Initializing the DB ---');
  if (err) {
    return console.log(err);
  }

  fetchData(runOutputs);
});