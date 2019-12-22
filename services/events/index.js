const express = require ("express");
const router = express.Router();
const fs = require ('fs-extra');
const path = require ('path');
const uuidv4 = require ('uuid/v4');
const multer = require('multer');

const eventsFilePath = path.join(__dirname,"events.json");
const usersFilePath = path.join(__dirname,"../users.json");

const readUsersFile = async()=>{
    const buffer = await fs.readFile(usersFilePath);
    const content = buffer.toString();
    return JSON.parse(content);
}

const readFile = async() =>{
    const buffer = await fs.readFile(eventsFilePath);
    const content = buffer.toString();
    return JSON.parse(content);
}

router.get("/", async (req,res)=>{
    const events = await readFile();
    res.send(events)
    console.log(events)
})

router.get("/:id",async (req,res)=>{
    const events = await readFile();
    const singleEvent = events.find(event => event._id === req.params.id);
    if (singleEvent){
        res.send(singleEvent)
    }else{
        res.status("404").send("Event not found")
    }
})

router.get("/:id/attendees",(req,res)=>{
    const users = readUsersFile();
    const usersForEvents = users.filter( user => user.elementId === req.params.id);
    if (usersForEvents){
        res.send(usersForEvents);
    }else{
        res.status("404").send("No attendees found");
    }
})

const multerConfig = multer({});
router.post("/:id/upload", multerConfig.single("prodPic"), async(req,res)=>{
    const events = readFile();
    const event = events.find(event => event._id === req.params.id);
    if(event){
        const fileDestination = path.join(__dirname,"../../../images", req.params.id + path.extname(req.file.originalname))
        await fs.writeFile(fileDestination, req.file.buffer)
        event.updatedAt = new Date();
        event.imageURL = "/images/" + req.params.id + path.extname(req.file.originalname);
        await fs.writeFile(eventsFilePath, events)
        res.send(event);
    }else{
        res.status("404").send("event not found");
    }
})

router.post("/", async (req,res)=>{
    const events = await readFile()
    const newEvents = {
        ...req.body,
        createdAt: new Date(),
        updatedAt: new Date(),
        _id: uuidv4(),
    }
    events.push(newEvents);
    await fs.writeFile(eventsFilePath, JSON.stringify(events));
    res.send(newEvents);
    console.log("Posting")
})

router.delete("/:id",async (req,res)=>{
    const events = await readFile();
    const eventsToStay = events.filter(event=> event._id !== req.params.id);
    if( eventsToStay.length < events.length ){
        await fs.writeFile(eventsFilePath, JSON.stringify(eventsToStay));
        res.send("removed")
    }else{
        res.status("404").send("event not found")
    }
    console.log("deleting")
})

router.put("/:id",async (req,res)=>{
    const events = await readFile();
    const eventsToEdit = events.find(event => event._id === req.params.id)
    if (eventsToEdit) {
        delete req.body._id;
        delete req.body.createdAt;
        req.body.updatedAt = new Date()
        let editedEvents = Object.assign(eventsToEdit, req.body)
        let position = events.indexOf(eventsToEdit);
        events[position] = editedEvents;
        await fs.writeFile(eventsFilePath, JSON.stringify(events))
        res.send(editedEvents)
    }else{
        res.status("404").send("No event found")
    }
    console.log("Editing")
})


module.exports = router