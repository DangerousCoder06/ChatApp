# 💬 Real-Time Chat & Video Call App

A full-stack real-time chat application with 1-on-1 video calling, built using **React**, **Node.js**, **Express**, **Socket.IO**, **MongoDB**, and **Stream Video SDK**.

---

## 🚀 Features

### 💬 Chat Features
- Real-time 1-on-1 messaging with Socket.IO
- Message status: Sent ✅, Delivered ✅✅, Seen ✅✅ (blue)
- Typing indicators
- Join/leave notifications
- Auto-scroll to latest messages
- Message persistence using `localStorage`
- Role-based access: Admin & User
- Admin actions: Mute / Unmute, Ban / Unban users
- Dark mode toggle
- User presence and online status

### 📹 Video Calling
- 1-on-1 video calling with Stream SDK
- Incoming call popup (Accept/Reject)
- Timeout for unanswered calls (20 sec)
- Opens call in a new window
- Call status: Ringing, In-call, Ended
- Caller/callee disconnection handling

---

## 📦 Tech Stack

| Frontend | Backend | Other |
|----------|---------|-------|
| React    | Node.js | Socket.IO |
| Tailwind CSS | Express.js | MongoDB + Mongoose |
| React Router | JWT | Stream Video SDK |
| Vite | bcrypt | uuid |

---