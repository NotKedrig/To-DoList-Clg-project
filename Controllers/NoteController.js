const Note = require("../Models/NoteModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

exports.getAllNotes = catchAsync(async (req, res, next) => {
  const notes = await Note.find({ user: req.user._id });
  res.status(200).json({
    status: "success",
    data: {
      notes,
    },
  });
});

exports.createNote = catchAsync(async (req, res, next) => {
  const { description, deadline } = req.body;

  if (!description) {
    return next(new AppError("Please provide a description", 400));
  }

  const note = await Note.create({
    description,
    deadline: deadline ? new Date(deadline) : null,
    user: req.user._id,
  });

  res.status(201).json({
    status: "success",
    data: {
      note,
    },
  });
});

exports.updateNote = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { description, done, deadline } = req.body;

  const updateData = {
    description,
    done,
    ...(deadline && { deadline: new Date(deadline) }),
  };

  const note = await Note.findOneAndUpdate(
    { _id: id, user: req.user._id },
    updateData,
    { new: true, runValidators: true }
  );

  if (!note) {
    return next(new AppError("No note found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      note,
    },
  });
});

exports.deleteNote = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const note = await Note.findOneAndDelete({
    _id: id,
    user: req.user._id,
  });

  if (!note) {
    return next(new AppError("No note found with that ID", 404));
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});
