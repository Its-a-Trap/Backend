var db = require('mongojs')('trap')


// /postlocationdata (location_history, user_id) -  upload location history to server for creation of heatmaps
exports.postLocationData = function(req, res) {
    var locationList = req.body
}

// /changeArea (location) - return mines and high scores within 10mi and subscribe to push notifications of new mines and high scores within 10mi
exports.changeArea = function(req, res) {
    console.log(req.body)

    var location = req.body.location
    if (!location) return res.send(400)
    var lat      = location.lat
    var lon      = location.lon
    var user     = req.body.user
    if (!lat || !lon || !user) return res.send(400)

    // TODO: Subscribe to push notifications somehow

    db.collection('mines')
        .find({
            owner: {$ne:user}
        })
        .map(function (mine) {
            return {
                id: mine._id,
                location: {
                    lon: mine.location.coordinates[0],
                    lat: mine.location.coordinates[1],
                },
                owner: mine.owner,
            }
        }, function (err, mines) {
            if (err) {
                console.log(err)
                return res.send(500)
            }
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
    var user = req.body.user

    db.collection('mines')
        .find({
            owner: user
        })
        .map(function (err, mine) {
            if (err) {
                console.log(err)
                return res.send(500)
            }
            res.send({
                location: {
                    lon: mine.location.coordinates[0],
                    lat: mine.location.coordinates[1],
                },
                owner: mine.owner,
            })
        })
}

// /plantmine (mine, user_id) - explode mine if it exists and return
exports.plantMine = function(req, res) {
    var lon   = req.body.location.lon
    var lat   = req.body.location.lat
    var owner = req.body.owner

    // TODO: Require client token rather than owner
    // TODO: Check that the user has mines available to place

    db.collection('mines').insert({
        location: {type:'Point', coordinates:[lon,lat]},
        owner: owner
    }, function (err) {
        if (err) {
            console.log(err)
            return res.send(500)
        }
        res.send()
    })
}

// /explodemine (mine, user_id) - explode mine if it exists and return
exports.explodeMine = function(req, res) {
    var payload = req.body
}