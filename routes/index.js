var mongojs = require('mongojs')
var db      = mongojs('trap')
var request = require('request')


var serverError = function(res, err) {
  console.log(err)
  res.send(500)
}

var requestError = function(res, err) {
  console.log(err)
  res.send(400)
}

// Convert a mine returned by the database to a cleaned up object for sending
var prettyMine = function(mine) {
  return {
    id: mine._id,
    location: {
      lon: mine.location.coordinates[0],
      lat: mine.location.coordinates[1],
    },
    owner: mongojs.ObjectId(mine.owner),
  }
}

// Convert a player returned by the database to a cleaned up object for sending
var prettyPlayer = function(player) {
  return {
    id: player._id,
    name: player.name,
    email: player.name,
    score: player.score,
  }
}

var tellClientsToGetNewData = function(){
  return // TODO: Make this actually work
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

var subscribeToPush = function(user,type){
  return // TODO: Make this actually work
  request({
    "url":"http://localhost:8000/subscribe",
    "method":"POST",
    "body":
      {
        "user":user,
        "type":type,
        "token":"CAFEBABE"
      }
  })
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
  var client_type = req.body.client_type
  if (!lat || !lon || !user) return requestError(res, "missing location.lat, location.lon or user")

  // TODO: Subscribe to push notifications somehow
  subscribeToPush(user,client_type)

  db.collection('mines')
    .find({
      owner: mongojs.ObjectId(user),
      active: true,
    })
    .map(prettyMine, function (err, myMines) {
      if (err) return serverError(res, err)

      db.collection('mines')
        .find({
          owner: {$ne:mongojs.ObjectId(user)},
          active: true,
        })
        .map(prettyMine, function (err, mines) {
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

// /placemine (mine, user_id) - explode mine if it exists and return
exports.placeMine = function(req, res) {
  console.log("\nplaceMine")
  console.log(req.body)

  var lat   = req.body.location.lat
  var lon   = req.body.location.lon
  var user  = req.body.user
  if (!lat || !lon || !user) return serverError(res, "missing lat, lon or user")

  // TODO: Require client token rather than user
  // TODO: Check that the user has mines available to place

  db.collection('mines')
    .insert(
      {
        active: true,
        location: {type:'Point', coordinates:[lon,lat]},
        owner: mongojs.ObjectId(user),
      },
      function (err, inserted) {
        if (err) return serverError(res, err)
        res.send(inserted)
      }
    )

  // update users affected by new mine (everyone in the area)
  tellClientsToGetNewData()
}

// /getuserid (email) - explode mine if it exists and return
exports.getUserId = function(req, res) {
  console.log("\ngetUserId")
  console.log(req.body)

  var email = req.body.email
  if (!email) return serverError(res, "missing email")

  db.collection('players')
    .find(
      {email: email},
      function(err, players) {
        if (err) return serverError(res, err)

        if (players.length > 0) return res.send(players[0]._id)

        db.collection('players')
          .insert(
            {
              email: email,
              name: email,
              score: 0,
            },
            function(err, inserted) {
              if (err) return serverError(res, err)

              res.send(inserted._id)
            }
          )
      }
    )
}

// /removemine (mine) - remove a mine without exploding anyone
exports.removeMine = function(req, res) {
  console.log("\nremoveMine")
  console.log(req.body)

  var id = req.body.id
  if (!id) return requestError(res, "missing id")

  console.log(mongojs.ObjectId(id))
  db.collection('mines')
    .remove(
      {_id: mongojs.ObjectId(id)},
      function (err, result) {
        if (err) return serverError(res, err)
        res.send(result.n > 0)
      }
    )

  // update users affected by the removed mine (everyone in the area)
  tellClientsToGetNewData()
}

// /explodemine (mine, user_id) - explode mine if it exists and return
exports.explodeMine = function(req, res) {
  console.log("\nexplodeMine")
  console.log(req.body)

  var id   = req.body.id // maybe?
  var user = req.body.user // maybe?
  if (!id || !user) return requestError(res, "missing id or user")

  // Reconcile database stuff
  db.collection('mines')
    .findAndModify(
      {
        query: {
          _id: mongojs.ObjectId(id),
          active: true,
        },
        update: {$set: {active: false}},
        new: false,
      },
      function(err, mine) {
        if (err) return serverError(res, err)

        res.send(!!mine)

        // Increment owner's score
        if (mine) {
          db.collection('players')
            .update(
              {_id: mine.owner},
              {$inc: {score: 100}},
              function(err) {
                if (err) return serverError(res, err)
              }
            )
        }
      }
    )

  // Figure out who to notify (person who owns the mine, everyone in the area) // reminder - only the latest will be sent to iOS devices
  tellClientsToGetNewData()
}