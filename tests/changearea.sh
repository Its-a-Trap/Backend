#!/bin/bash

curl -X POST --header 'Content-Type:application/json' http://localhost:3000/api/changearea -d @changearea.json