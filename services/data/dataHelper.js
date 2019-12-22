const fs = require("fs-extra");
const path = require ("path");

const eventsPath = path.join(__dirname,"events.json");
const usersPath = path.join(__dirname, "users.json");

module.exports = {
    getEvents: async()=>{
        const buffer = await fs.readFile(eventsPath);
        const content = buffer.toString();
        return JSON.parse(content)
    },
    getUsers: async()=>{
        const buffer = await fs.readFile(usersPath);
        const content = buffer.toString();
        return JSON.parse(content);
    },
    writeEvent: async(data)=>{
        await fs.writeFile(eventsPath,JSON.stringify(data));
    },
    writeUsers: async(data)=>{
        await fs.writeFile(usersPath,JSON.stringify(data))
    }
}