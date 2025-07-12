import mongoose from "mongoose";

const actionSchema = new mongoose.Schema({
  message: String,
  date: {
    type: String,
    default: new Date(Date.now()).toLocaleDateString('en-IN', {
      month: 'short', year: 'numeric',
      weekday: 'short', day: '2-digit',
    })
  },
  time: {
    type: String,
    default: new Date(Date.now()).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }
});

const adminActionSchema = new mongoose.Schema({
  actions: [actionSchema]
});

export default mongoose.model("Action", adminActionSchema);