
import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  id: String,
  sender: String,
  message: String,
  date: String,
  time: String,
  status: String
});

const chatSchema = new mongoose.Schema({
  messages: [messageSchema]
});

export default mongoose.model("Chat", chatSchema);
