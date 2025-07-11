import express from "express"
import { createServer } from "http"
import cors from "cors"
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import dotenv from "dotenv"
import User from "./models/User.js"
import Auth from "./middleware/auth.js"
import { Server } from "socket.io"
import Chat from "./models/Chat.js"
import { v4 as uuidv4 } from "uuid"

dotenv.config()
const app = express()
const server = createServer(app)
const io = new Server(server, {
    cors: {
        origin: ["http://localhost:5173",
        process.env.FRONTEND_URL]
    }
})
const port = 3000

const onlineUsers = new Map();
const allUsers = [];


io.on('connection', socket => {
    socket.on('user-message', async (message) => {
        socket.broadcast.emit('message', message)

        try {
            await Chat.findOneAndUpdate(
                {},
                { $push: { messages: message } },
                { upsert: true, new: true }
            );
        } catch (error) {
            console.error("Error saving chat message:", error);
        }

    })

    socket.on("toggle-mute", async ({ targetUsername, by }) => {
        try {
            const user = await User.findOne({ username: targetUsername });
            if (user) {
                user.isMuted = !user.isMuted;
                await user.save();

                io.emit("mute-status-updated", {
                    username: targetUsername,
                    isMuted: user.isMuted,
                    mutedBy: by
                });
            }
        } catch (error) {
            console.error("Error toggling mute:", error);
        }
    });
    socket.on("toggle-ban", async ({ targetUsername, by }) => {
        try {
            const user = await User.findOne({ username: targetUsername });
            if (user) {
                user.isBanned = !user.isBanned;
                await user.save();

                io.emit("ban-status-updated", {
                    username: targetUsername,
                    isBanned: user.isBanned,
                    bannedBy: by
                });

            }
        } catch (error) {
            console.error("Error toggling ban:", error);
        }
    });


    socket.on('status', async msg => {

        await Chat.findOneAndUpdate(
            { "messages.id": msg.id },
            { $set: { "messages.$.status": msg.status } },
            { new: true }
        )
        socket.broadcast.emit('userside-chat', msg)
    })

    socket.on("typing", (username) => {
        socket.broadcast.emit("show-typing", username);
    });

    socket.on('user-connected', async (username) => {

        const users = await User.find({})

        const user = await User.findOne({ username })
        if (user.isBanned) {
            return
        }

        onlineUsers.set(socket.id, username);


        allUsers.length = 0;

        for (const user of users) {
            allUsers.push(user);
        }

        io.emit("user-list", {
            onlineUsers: Array.from(onlineUsers.values()),
            allUsers
        })

        socket.broadcast.emit("user-online", username);


        const joinMessage = {
            id: uuidv4(),
            message: `${username} joined the chat`,
            type: "join",
            date: new Date(Date.now()).toLocaleDateString('en-IN', {
                weekday: 'short', day: '2-digit',
                month: 'short', year: 'numeric'
            }),
            sender: username
        }
        io.emit('joined', joinMessage)

        socket.on("disconnect", () => {
            onlineUsers.delete(socket.id)

            io.emit("user-list", {
                onlineUsers: Array.from(onlineUsers.values()),
                allUsers
            })

            const leftMessage = {
                id: uuidv4(),
                type: "left",
                message: `${username} left the chat`,
                date: new Date(Date.now()).toLocaleDateString('en-IN', {
                    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric'
                })
            }
            socket.broadcast.emit('left', leftMessage)
        })
    })


});

const JWT_SECRET = process.env.JWT_SECRET

import mongoose from "mongoose"
await mongoose.connect(process.env.MONGO_URL)

app.use(cors(), express.json())

app.post('/register', async (req, res) => {
    try {
        const user = await User.create(req.body)
        const token = jwt.sign({ id: user._id, username: user.username },
            JWT_SECRET,
            { expiresIn: "2d" }
        );
        res.status(200).send({ token })

    } catch (e) {
        console.log(e);
        res.status(400).json({ error: "Username already exists" })
    }


})

app.post('/login', async (req, res) => {

    const { username, password } = req.body
    const user = await User.findOne({ username })

    if (!user) {
        return res.status(401).send({ error: "❌Invalid Credentials" })
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(401).send({ error: "❌Invalid Credentials" })
    }

    const token = jwt.sign({ id: user._id, username },
        JWT_SECRET,
        { expiresIn: "2d" }
    );
    await User.updateOne({ _id: user._id }, { timestamp: new Date(Date.now() + 19_800_000) })
    res.status(200).send({ token })

})
app.get('/verify', Auth, async (req, res) => {
    const user = await User.findOne({ username: req.user.username })
    if (!user) {
        res.status(401).send("User not found")
        return
    }

    res.json(req.user.username)
})


server.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})

