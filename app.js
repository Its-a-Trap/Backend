// Import stuff
var express    = require('express')
var bodyParser = require('body-parser')
var mongojs    = require('mongojs')
var routes     = require('./routes')

// Set up the App and connect to DB
app = express()
app.use(bodyParser())

// Set up the routes
app.get('/', function (req, res){ res.send({serverUp:1}) })
app.post('/api/postlocationdata', routes.postLocationData)
app.post('/api/changearea', routes.changeArea)
app.post('/api/plantmine', routes.plantMine)
app.post('/api/explodemine', routes.explodeMine)

// Run App
app.listen(3000)
console.log("Running at http://localhost:3000/")