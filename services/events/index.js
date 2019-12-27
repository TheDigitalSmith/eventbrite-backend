const express = require ("express");
const router = express.Router();
const { check, validationResult, sanitize} = require ('express-validator');
const fs = require ('fs-extra');
const path = require ('path');
const uuidv4 = require ('uuid/v4');
const multer = require('multer');
const {getEvents, getUsers, writeEvent} = require('../data/dataHelper')
const {Transform} = require('json2csv');

// const eventsFilePath = path.join(__dirname,"events.json");
// const usersFilePath = path.join(__dirname,"../users.json");

// const readUsersFile = async()=>{
//     const buffer = await fs.readFile(usersFilePath);
//     const content = buffer.toString();
//     return JSON.parse(content);
// }

// const readFile = async() =>{
//     const buffer = await fs.readFile(eventsFilePath);
//     const content = buffer.toString();
//     return JSON.parse(content);
// }

router.get("/", async (req,res)=>{
    const events = await getEvents();
    res.send(events)
    console.log(events)
})

router.get("/:id",async (req,res)=>{
    const events = await getEvents();
    const singleEvent = events.find(event => event._id === req.params.id);
    if (singleEvent){
        res.send(singleEvent)
    }else{
        res.status("404").send("Event not found")
    }
})

router.get("/:id/attendees",async (req,res)=>{
    const users = await getUsers();
    const usersForEvents = users.filter( user => user.elementId === req.params.id);
    if (usersForEvents){
        res.send(usersForEvents);
    }else{
        res.status("404").send("No attendees found");
    }
})

router.get("/:id/attendees/csv",async (req,res)=>{
    // const empty = {};
    const filePath = path.join(__dirname,'attendees.json');
    // await fs.writeFile(filepath, JSON.stringify(empty));
    const attendees = await getUsers();
    const attendeesForEvent = attendees.filter(attendee => attendee.elementId === req.params.id);
    await fs.writeFile(filePath, JSON.stringify(attendeesForEvent))
    const fields = ["firstname", "surname", "email"];
    const opts = {fields};
    const json2csv = new Transform (opts);

    fs.createReadStream(filePath)
    .pipe(json2csv)
    .pipe(res);
})

const multerConfig = multer({});
router.post("/:id/upload", multerConfig.single("prodPic"), async(req,res)=>{
    const events = getEvents();
    const event = events.find(event => event._id === req.params.id);
    if(event){
        const fileDestination = path.join(__dirname,"../../../images", req.params.id + path.extname(req.file.originalname))
        await fs.writeFile(fileDestination, req.file.buffer)
        event.updatedAt = new Date();
        event.imageURL = "/images/" + req.params.id + path.extname(req.file.originalname);
        await writeEvent(events)
        res.send(event);
    }else{
        res.status("404").send("event not found");
    }
})

router.post("/", [
    check ('eventName').isLength({min:5}).withMessage("Event must have a minimum 5 chars"),
    check ('place').exists().withMessage("Must have place"),
    check ('description').isLength({min: 20}).withMessage("Description must consist of minimum 20 chars")]
    ,async (req,res)=>{
        const errors = validationResult(req);
        if (!errors.isEmpty()){
           return res.status("422").json({errors: errors.array()});
        }
    const events = await getEvents()
    const newEvents = {
        ...req.body,
        createdAt: new Date(),
        updatedAt: new Date(),
        _id: uuidv4(),
    }
    events.push(newEvents);
    await writeEvent(events);
    res.send(newEvents);
    console.log("Posting")
})

router.delete("/:id",async (req,res)=>{
    const events = await getEvents();
    const eventsToStay = events.filter(event=> event._id !== req.params.id);
    if( eventsToStay.length < events.length ){
        await writeEvent(eventsToStay);
        res.send("removed")
    }else{
        res.status("404").send("event not found")
    }
    console.log("deleting")
})

router.put("/:id",async (req,res)=>{
    const events = await getEvents();
    const eventsToEdit = events.find(event => event._id === req.params.id)
    if (eventsToEdit) {
        delete req.body._id;
        delete req.body.createdAt;
        req.body.updatedAt = new Date()
        let editedEvents = Object.assign(eventsToEdit, req.body)
        let position = events.indexOf(eventsToEdit);
        events[position] = editedEvents;
        await writeEvent(events);
        res.send(editedEvents);
    }else{
        res.status("404").send("No event found")
    }
    console.log("Editing")
})


module.exports = router