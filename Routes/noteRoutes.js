const express = require("express");
const router = express.Router();
const noteController = require("../Controllers/NoteController");
const authController = require("../Controllers/authController");
router.use(authController.protect);
router
  .route("/")
  .get(noteController.getAllNotes)
  .post(noteController.createNote);

router
  .route("/:id")
  .patch(noteController.updateNote)
  .delete(noteController.deleteNote);

module.exports = router;
