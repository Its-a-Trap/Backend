/* It's a Trap
 * May 2014
 *
 * This file contains the routes.
 */
var db = require('mongojs')('trap')


// /postlocationdata (location_history, user_id) -  upload location history to server for creation of heatmaps
exports.postLocationData = function(req, res) {
    var locationList = req.body




}

// /changeArea (location) - return mines and high scores within 10mi and subscribe to push notifications of new mines and high scores within 10mi
exports.changeArea = function(req, res) {
    var payload = req.body

    // Get mines within 10mi
    db.collection('mines').find()
    // Get high scores within 10mi

    // Subscribe push notifications somehow


}

// /explodemine (mine, user_id) - explode mine if it exists and return
exports.explodeMine = function(req, res) {
    var payload = req.body

}


/*
user registration callbacks - per login mechanism

later....
*/
