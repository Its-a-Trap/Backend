var db = require('mongojs')('trap')


// /postlocationdata (location_history, user_id) -  upload location history to server for creation of heatmaps
exports.postLocationData = function(req, res) {
    var locationList = req.body
}

// /changeArea (location) - return mines and high scores within 10mi and subscribe to push notifications of new mines and high scores within 10mi
exports.changeArea = function(req, res) {
    var lat = req.body.location.lat
    var lon = req.body.location.lon

    // TODO: Subscribe to push notifications somehow

    db.collection('mines')
        .find()
        .map(function (mine) {
            return {
                location: {
                    lon: mine.location.coordinates[0],
                    lat: mine.location.coordinates[1],
                },
                owner: mine.owner,
            }
        }, function (err, mines) {
            db.collection('scores')
                .find(function (err, scores) {
                res.send({
                    'mines': mines,
                    'scores': scores,
                })
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
        res.send(!err)
    })
}

// /explodemine (mine, user_id) - explode mine if it exists and return
exports.explodeMine = function(req, res) {
    var payload = req.body
}