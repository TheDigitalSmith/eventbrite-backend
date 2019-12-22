const express = require ("express");
const server = express();
const eventsServices = require("./services/events/index");
const usersServices = require ("./services/users/index");
const PORT = 4500


server.use(express.json())

server.use("/users", usersServices);
server.use("/events", eventsServices);

server.listen(PORT, ()=>{
    console.log(`Yo man! your server is launched at launchpad ${PORT}`)
})