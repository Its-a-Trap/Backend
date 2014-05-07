/* It's a Trap
 * May 2014
 */


// Import stuff
var express = require('express'),
    routes  = require('./routes'),
    MongoClient = require('mongodb').MongoClient
    , format = require('util').format;


// Set up the App
app = express()
app.use(express.bodyParser());

// Set up the routes
app.post('/search', routes.search.doSearch)



// Connect to DB and run
MongoClient.connect('mongodb://127.0.0.1:27017/trap', function(err, db) {
  if(err) throw err;

  app.listen(3000)
  console.log("Running at http://localhost:3000/")

  // saved for querying sake

  // var collection = db.collection('test_insert');
  // collection.insert({a:2}, function(err, docs) {

  //   collection.count(function(err, count) {
  //     console.log(format("count = %s", count));
  //   });

  //   // Locate all the entries using find
  //   collection.find().toArray(function(err, results) {
  //     console.dir(results);
  //     // Let's close the db
  //     db.close();
  //   });
  // });
})