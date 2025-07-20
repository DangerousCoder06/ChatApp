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
import { StreamChat } from "stream-chat"
import Action from "./models/Action.js"
import authRouter from "./routes/streamAuth.js"

dotenv.config()
const app = express()
const server = createServer(app)
const io = new Server(server, {
    cors: {
        origin: "*"
    }
})
const port = 3000

const onlineUsers = new Map();
const videoUsers = new Map()
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

    socket.on("incoming-call", ({ callee, callId, caller }) => {
        const calleeSocketId = onlineUsers.get(callee)
        if (calleeSocketId) {
            io.to(calleeSocketId).emit("incoming-call", { callId, caller })
        }
    })

    socket.on("call-rejected", (username) => {
        socket.broadcast.emit("call-rejected-alert", username)
    })

    socket.on("timeOut", () => {
        socket.broadcast.emit("timeOut-response")
    })

    socket.on("call-ended", ({ to }) => {
        const targetSocket = onlineUsers.get(to);
        if (targetSocket) {
            io.to(targetSocket).emit("incoming-null");
        }
    });

    socket.on("caller-hangup", ({ to }) => {
        const targetSocket = videoUsers.get(to);
        if (targetSocket) {
            io.to(targetSocket).emit("caller-hangup-alert");
        }
    });

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

                await Action.findOneAndUpdate(
                    {},
                    {
                        $push: {
                            actions: {
                                message: `${by} ${user.isMuted ? "muted" : "unmuted"} ${targetUsername}`,
                                date: new Date().toLocaleDateString('en-IN', {
                                    month: 'short',
                                    year: 'numeric',
                                    weekday: 'short',
                                    day: '2-digit'
                                }),
                                time: new Date().toLocaleTimeString('en-IN', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: false
                                })
                            }
                        }
                    },
                    { upsert: true, new: true }
                );

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

                await Action.findOneAndUpdate(
                    {},
                    {
                        $push: {
                            actions: {
                                message: `${by} ${user.isBanned ? "banned" : "unbanned"} ${targetUsername}`,
                                date: new Date().toLocaleDateString('en-IN', {
                                    month: 'short',
                                    year: 'numeric',
                                    weekday: 'short',
                                    day: '2-digit'
                                }),
                                time: new Date().toLocaleTimeString('en-IN', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: false
                                })
                            }
                        }
                    },
                    { upsert: true, new: true }
                );


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

    socket.on('user-connected', async ({ username, from, token }) => {

        const users = await User.find({})

        const user = await User.findOne({ username })
        if (user){
            if (user.isBanned || !token) {
                return
            }
        }

        socket.emit("mute-status", {isMuted: user.isMuted})

        if (from === "chat") {
            onlineUsers.set(username, socket.id);
        }

        if (from === "video") {
            videoUsers.set(username, socket.id);
        }

        allUsers.length = 0;

        for (const user of users) {
            allUsers.push(user);
        }

        io.emit("user-list", {
            onlineUsers: Array.from(onlineUsers.keys()),
            videoUsers: Array.from(videoUsers.keys()),
            allUsers
        })

        socket.broadcast.emit("user-online", username);

        const joinMessage = {
            id: uuidv4(),
            message: `${username} joined the chat`,
            type: "join",
            date: new Date(Date.now()).toLocaleDateString('en-IN', {
                month: 'short', year: 'numeric',
                weekday: 'short', day: '2-digit',
            }),
            sender: username
        }
        if (from === "chat") {
            io.emit('joined', joinMessage)
        }

        socket.on("disconnect", () => {
            if (from === "chat") {
                for (const [username, id] of onlineUsers) {
                    if (id === socket.id) {
                        onlineUsers.delete(username)
                    }
                }
            }

            if (from === "video") {
                for (const [username, id] of videoUsers) {
                    if (id === socket.id) {
                        videoUsers.delete(username)
                    }
                }
            }

            io.emit("user-list", {
                onlineUsers: Array.from(onlineUsers.keys()),
                videoUsers: Array.from(videoUsers.keys()),
                allUsers
            })

            if (from === "video") {
                socket.broadcast.emit("disconnect-alert", username)
            }

            const leftMessage = {
                id: uuidv4(),
                type: "left",
                message: `${username} left the chat`,
                date: new Date(Date.now()).toLocaleDateString('en-IN', {
                    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric'
                })
            }
            if (from === "chat") {
                socket.broadcast.emit('left', leftMessage)
            }
        })

        socket.emit("content-loaded")
    })
});

const JWT_SECRET = process.env.JWT_SECRET

const apiKey = process.env.STREAM_API_KEY
const apiSecret = process.env.STREAM_SECRET
const serverClient = StreamChat.getInstance(apiKey, apiSecret);

import mongoose from "mongoose"
await mongoose.connect(process.env.MONGO_URL)


app.use(cors(), express.json())
app.use('/auth', authRouter)


app.post("/token", (req, res) => {
    const { userId } = req.body;
    const token = serverClient.createToken(userId);
    res.json({ token, apiKey });
});

app.post('/register', async (req, res) => {
    try {
        const user = await User.create(req.body)
        const token = jwt.sign({ id: user._id, username: user.username },
            JWT_SECRET,
            { expiresIn: "2d" }
        );
        res.status(200).json({token})

    } catch (e) {
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
    if (user.isBanned){
        return res.status(403).send("User is banned")
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

    if (user.isBanned){
        res.status(403).send("User is banned")
        return
    }

    res.json(req.user.username)
})

server.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})