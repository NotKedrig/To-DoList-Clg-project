const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema({
  description: {
    type: String,
    required: [true, "A note must have a description"],
  },
  done: {
    type: Boolean,
    default: false,
  },
  deadline: {
    type: Date,
    default: null,
  },
  notified: {
    type: Boolean,
    default: false,
  },
  overdue: {
    type: Boolean,
    default: false,
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "Fields",
    required: [true, "A note must belong to a user"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Note = mongoose.model("Note", noteSchema);

module.exports = Note;
