/* It's a Trap
 * May 2014
 *
 * This file contains the app setup.
 */


// Import stuff
var express = require('express'),
    routes  = require('./routes'),
    mongojs = require('mongojs')

// Set up the App and connect to DB
app = express()
app.use(express.json())
// app.use(express.bodyParser()); // COULD BE DEPRECATED?!?!?!? http://andrewkelley.me/post/do-not-use-bodyparser-with-express-js.html

// Set up the routes
app.post('/postlocationdata', routes.postLocationData)
app.post('/changearea', routes.getMines)
app.post('/explodemine', routes.explodeMine)

// Run App
app.listen(3000)
console.log("Running at http://localhost:3000/")