const express = require("express");
const router = express.Router();
const fs = require('fs-extra');
const path = require('path');
const uuidv4 = require('uuid/v4');
const {getEvents, getUsers, writeUsers} = require("../data/dataHelper");
const {check, validationResult} = require('express-validator');
// const usersFilePath = path.join(__dirname, "users.json");
// const eventsFilePath = path.join(__dirname, "../events/events.json");

// const readEvents = async () => {
//     const buffer = await fs.readFile(eventsFilePath);
//     const content = buffer.toString();
//     return JSON.parse(content);
// }

// const readFile = async () => {
//     const buffer = await fs.readFile(usersFilePath);
//     const content = buffer.toString();
//     return JSON.parse(content);
// }

router.get("/", async (req, res) => {
    const users = await getUsers();
    res.send(users);
})

router.get("/:id", async (req, res) => {
    const users = await getUsers();
    const singleUser = users.find(user => user._id === req.params.id);
    if (singleUser) {
        res.send(singleUser);
    } else {
        res.status("404").send("User Not Found");
    }
})

router.post("/",[
    check('firstname').isLength({min:3}).withMessage('firstname required, minimum 3 chars'),
    check('surname').isLength({min:3}).withMessage('surname required, minimum 3 chars'),
    check('email').isEmail().withMessage('email required'),
    check('timeOfArrival').exists()
], async (req, res) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        res.status('422').json({errors: errors.array()});
    }
    const events = await getEvents();
    const users = await getUsers();
    const userInEvents = events.find(event => event._id === req.body.elementId)
    if (userInEvents) {
        const newUser = {
            ...req.body,
            createdAt: new Date(),
            updatedAt: new Date(),
            _id: uuidv4()
        }
        users.push(newUser);
        await writeUsers(users);
        res.send(newUser);
    } else {
        res.status("404").send("No events found")
    }
})

router.delete("/:id", async (req, res) => {
    const users = await getUsers();
    const usersToStay = users.filter(user => user._id !== req.params.id);
    if (usersToStay.length < users.length) {
        await writeUsers(usersToStay);
        res.send("removed");
    } else {
        res.status("404").send("user not found");
    }
})

router.put("/:id", async (req, res) => {
    const events = await getEvents();
    const users = await getUsers();
    const usersInEventsToEdit = events.find(event => event._id === req.body.elementId)
    if (req.body.elementId && usersInEventsToEdit) {
        const userToEdit = users.find(user => user._id === req.params.id);
        if (userToEdit) {
            delete req.body._id;
            delete req.body.createdAt;
            delete req.body.updatedAt;
            req.body.updatedAt = new Date();
            let editedUser = Object.assign(userToEdit, req.body);
            let position = users.indexOf(userToEdit);
            users[position] = editedUser;
            await writeUsers(users);
            res.send(editedUser);
        } else {
            res.status("404").send("User not found");
        }
    } else {
        res.status("404").send("No events found")
    }

})
module.exports = router