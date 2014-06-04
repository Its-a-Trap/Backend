  _______                 _____ _                 _ 
 |__   __|               / ____| |               | |
    | |_ __ __ _ _ __   | |    | | ___  _   _  __| |
    | | '__/ _` | '_ \  | |    | |/ _ \| | | |/ _` |
    | | | | (_| | |_) | | |____| | (_) | |_| | (_| |
    |_|_|  \__,_| .__/   \_____|_|\___/ \__,_|\__,_|
                | |                                 
                |_|                                 


Description
===========
Trap Cloud is the backend for "Its a Trap". It stores user and mine data and notifies clients of updates in their vicinity.


Status
======
All basic functionality exists. Clients may register accounts, view scores, view traps, plant traps, remove traps, and trigger traps.

Android clients update their caches whenever they receive a push notification or "tickle" from the server. The server sends these notifications when anyone's score or mines change to alert all clients that their data is stale.

iOS push requires some involved key registration that Mike was too busy to do this term, so iOS clients poll the server at 1 minute intervals.


Getting Started
===============
We have the server up and running on a rented VM, so you don't have to do anything.
