var mongojs = require('mongojs')
var db      = mongojs('trap'),
  request = require('request')


var serverError = function(res, err) {
  console.log(err)
  res.send(500)
}

var requestError = function(res, err) {
  console.log(err)
  res.send(400)
}

// Convert a mine returned by the database to a cleaned up object for sending
var convertMinBetterFormat = function(mine) {
  return {
    id: mine._id,
    location: {
      lon: mine.location.coordinates[0],
      lat: mine.location.coordinates[1],
    },
    owner: mongojs.ObjectId(mine.owner),
  }
}

// /postlocationdata (location_history, user_id) -  upload location history to server for creation of heatmaps
exports.postLocationData = function(req, res) {
  var locationList = req.body.locations
  var user = req.body.user

  // TODO: Implement this
  for (var i = locationList.length - 1; i >= 0; i--) {
    locationList[i].user = user
    db.collection('location_history')
      .insert(
        locationList[i]
    )
  }

  res.send({success:1})
}

// /changeArea (location) - return mines and high scores within 10mi and subscribe to push notifications of new mines and high scores within 10mi
exports.changeArea = function(req, res) {
  console.log("\nchangeArea")
  console.log(req.body)

  var location = req.body.location
  if (!location) return requestError(res, "missing location")
  var lat      = location.lat
  var lon      = location.lon
  var user     = req.body.user
  if (!lat || !lon || !user) return requestError(res, "missing location.lat, location.lon or user")

  // TODO: Subscribe to push notifications somehow

  db.collection('mines')
    .find({owner: mongojs.ObjectId(user)})
    .map(convertMineToBetterFormat, function (err, myMines) {
      if (err) return serverError(res, err)

      db.collection('mines')
        .find({owner: {$ne:mongojs.ObjectId(user)}})
        .map(convertMineToBetterFormat, function (err, mines) {
          if (err) return serverError(res, err)

          db.collection('players')
            .find(function (err, scores) {
              if (err) return serverError(res, err)

              res.send({
                'myMines': myMines,
                'mines': mines,
                'scores': scores,
              })
            })
          }
        )
    }
  )
}

// /plantmine (mine, user_id) - explode mine if it exists and return
exports.plantMine = function(req, res) {
  console.log("\nplantMine")
  console.log(req.body)

  var lon   = req.body.location.lon
  var lat   = req.body.location.lat
  var owner = req.body.owner

  // TODO: Require client token rather than owner
  // TODO: Check that the user has mines available to place

  db.collection('mines')
    .insert({
      location: {type:'Point', coordinates:[lon,lat]},
      owner: owner
    }, function (err, objects) {
      if (err) return serverError(res, err)
      console.log(objects)
      res.send(objects[0])
    }
  )

  // update users affected by new mine (everyone in the area)
}

// /explodemine (mine, user_id) - explode mine if it exists and return
exports.explodeMine = function(req, res) {
  var id    = req.body.id // maybe?

  // Reconcile database stuff
  db.collection('mines')
    .findAndModify(
      {_id: id},
      [['_id','asc']],
      {$set: {active:false}},
      {},
      function (err, object){
        if (err) console.warn(err.message)
        if (object) res.send({success:1})
        else res.send({success:0})
      }
  )

  // Figure out who to notify (person who owns the mine, everyone in the area) // reminder - only the latest will be sent to iOS devices
  request({
    "url":"http://localhost:8000/send",
    "method":"POST",
    "body": 
      { "android": {
        // "collapseKey": "optional",
        "data": {
          "message": "Your message here"
        }
      },
        "ios": {
          "badge": 0,
          "alert": "Your message here",
          // "sound": "soundName"
        }
      }
  })
}