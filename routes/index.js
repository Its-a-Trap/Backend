var mongojs = require('mongojs')
var db      = mongojs('trap')


var serverError = function(res, err) {
    console.log(err)
    res.send(500)
}

var requestError = function(res, err) {
    console.log(err)
    res.send(400)
}

// /postlocationdata (location_history, user_id) -  upload location history to server for creation of heatmaps
exports.postLocationData = function(req, res) {
    var locationList = req.body

    // TODO: Implement this
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
        .find({
            owner: {$ne:mongojs.ObjectId(user)}
        })
        .map(function (mine) {
            return {
                id: mine._id,
                location: {
                    lon: mine.location.coordinates[0],
                    lat: mine.location.coordinates[1],
                },
                owner: mongojs.ObjectId(mine.owner),
            }
        }, function (err, mines) {
            if (err) return serverError(res, err)
            db.collection('players')
                .find(function (err, scores) {
                if (err) {
                    console.log(err)
                    return res.send(500)
                }
                res.send({
                    'mines': mines,
                    'scores': scores,
                })
            })
        })
}

// /mymines (user) - return a list of the given user's mines
exports.myMines = function(req, res) {
    console.log("\nmyMines")
    console.log(req.body)

    var user = req.body.user

    db.collection('mines')
        .find({
            owner: mongojs.ObjectId(user)
        })
        .map(function (err, mine) {
            if (err) return serverError(res, err)
            res.send({
                location: {
                    lon: mine.location.coordinates[0],
                    lat: mine.location.coordinates[1],
                },
                owner: mongojs.ObjectId(mine.owner),
            })
        })
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
        }, function (err) {
            if (err) return serverError(res, err)
            res.send()
        })
}

// /explodemine (mine, user_id) - explode mine if it exists and return
exports.explodeMine = function(req, res) {
    var payload = req.body

    // TODO: Implement this
}