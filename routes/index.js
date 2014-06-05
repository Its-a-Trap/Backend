var mongojs = require('mongojs')
var db      = mongojs('trap')
var request = require('request')


var serverError = function(res, err) {
  console.log(err)
  res.send(500)
}

var requestError = function(res, err) {
  console.log(err)
  res.send(400, {error: err})
}

var printDate = function() {
  console.log("\n")
  console.log(new Date().getTime())
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

var tellSomeoneTheyGotAKill = function(victim,killer){
  console.log("\n\nSending pushes!\n\n")
  // return // TODO: Make this actually work
  request({
    "url":"http://localhost:8000/send",
    "method":"POST",
    "json": { "users": [killer],
        "android": {
        "collapseKey": "kills",
        "data": {
          "message": "killed " + victim
        }
      }
    }
  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      console.log("Sent tell someone they got a kill Push.")
      console.log(body) // Print the google web page.
    }
  })
}

var tellClientsToGetNewData = function(){
  console.log("\n\nSending pushes!\n\n")
  // return // TODO: Make this actually work
  request({
    "url":"http://localhost:8000/send",
    "method":"POST",
    "json": { "android": {
          "collapseKey": "data",
          "data": {
            "message": "refreshdata"
          }
        }
    }
  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      console.log("Sent Get New Data Push.")
      console.log(body) // Print the google web page.
    }
  })
}

var subscribeToPush = function(user,type,token){
  // return // TODO: Make this actually work
  request({
    "url":"http://localhost:8000/subscribe",
    "method":"POST",
    "json":
      {
        "user":user,
        "type":type,
        "token":token
      }
  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      console.log("Sent Subscribe Push.")
      console.log(body) // Print the google web page.
    }
  })
}

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

exports.killUser = function(req, res){
  printDate()
  console.log("\nkillUser")
  console.log(req.body)

  var user  = req.body.user

  // Remove points from them
  db.collection('players')
    .findOne(
      {
        _id:user,
        score:{$gt:100}
      }, function(err, user){
        
        if(user) {
          console.log("Found a user")
          db.collection('players')
            .findAndModify(
              {
                query: {_id: user._id},
                update: {$inc: {score: -100}},
                new: false,
              },
              function(err, owner) {
                if (err) return serverError(res, err)
                if (owner) console.log("Subtracted points")
                tellSomeoneTheyGotAKill(user,owner.name)
              }
          )
        }
      }
  )

  // Remove that user's mines
  db.collection('mines')
    .findAndModify(
      {
        query: {
                  owner: mongojs.ObjectId(user),
                  active: true,
               },
        update: {$unset: {owner: 1}}
      }, function(err, mines){
        console.log("Removed mines")
        res.send(true)
      }
  )
}

exports.changeArea = function(req, res) {
  printDate()
  console.log("\nchangeArea")
  console.log(req.body)

  var location = req.body.location
  if (!location) return requestError(res, "missing location")
  var lat      = location.lat
  var lon      = location.lon
  var user     = req.body.user
  var client_type = req.body.client_type
  var token = req.body.token
  if (!lat || !lon || !user) return requestError(res, "missing location.lat, location.lon or user")

  // TODO: Subscribe to push notifications somehow
  if (client_type == "Android") subscribeToPush(user,client_type,token)

  var count = 0
  var index = 0
  var score = 0

  db.collection('mines')
    .find({
      owner: mongojs.ObjectId(user),
      active: true,
    })
    .map(prettyMine, function(err, myMines) {
      if (err) return serverError(res, err)

      db.collection('mines')
        .find({
          owner: {$ne: mongojs.ObjectId(user)},
          active: true,
        })
        .map(prettyMine, function(err, mines) {
          if (err) return serverError(res, err)

          db.collection('players')
            .find()
            .sort({score: -1})
            .map(
              function(player) {
                if (player._id.toString() == user) {
                  score = player.score
                  index = count
                }
                count++
                return prettyPlayer(player)
              },
              function(err, scores) {
                if (err) return serverError(res, err)

                res.send({
                  'myMines': myMines,
                  'mines': mines,
                  'scores': scores,
                  'myScoreIndex': index,
                  'myScore': score,
                })
              }
            )
        })
    }
  )
}

exports.placeMine = function(req, res) {
  printDate()
  console.log("\nplaceMine")
  console.log(req.body)

  var lat   = req.body.location.lat
  var lon   = req.body.location.lon
  var user  = req.body.user
  if (!lat || !lon || !user) return requestError(res, "missing lat, lon or user")

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

        res.send(prettyMine(inserted))
      }
    )

  // update users affected by new mine (everyone in the area)
  tellClientsToGetNewData()
}

exports.getUserId = function(req, res) {
  printDate()
  console.log("\ngetUserId")
  console.log(req.body)

  var email = req.body.email
  var name  = req.body.name
  if (!email || !name) return requestError(res, "missing email or name")

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
              name: name,
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

exports.removeMine = function(req, res) {
  printDate()
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

exports.explodeMine = function(req, res) {
  printDate()
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

        if (!mine) return res.send({success: false})

        // Increment owner's score if there is an owner
        if(mine.owner){
          db.collection('players')
          .findAndModify(
            {
              query: {_id: mine.owner},
              update: {$inc: {score: 100}},
              new: false,
            },
            function(err, owner) {
              if (err) return serverError(res, err)

              res.send({
                success: true,
                ownerName: owner.name,
              })
            }
          )
        }
      }
    )

  // Figure out who to notify (person who owns the mine, everyone in the area) // reminder - only the latest will be sent to iOS devices
  tellClientsToGetNewData()
}