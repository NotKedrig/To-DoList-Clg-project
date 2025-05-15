const Note = require("../Models/NoteModel");
const moment = require("moment");

class ReminderService {
  constructor() {
    this.checkInterval = 60000; // Check every minute
    this.notificationThreshold = 15; // Notify 15 minutes before deadline
  }

  start() {
    setInterval(() => this.checkDeadlines(), this.checkInterval);
  }

  async checkDeadlines() {
    try {
      const now = new Date();
      const upcomingThreshold = new Date(
        now.getTime() + this.notificationThreshold * 60000
      );

      // Find notes with deadlines within the next 15 minutes
      const upcomingNotes = await Note.find({
        deadline: {
          $gte: now,
          $lte: upcomingThreshold,
        },
        done: false,
        notified: { $ne: true },
      });

      // Process each upcoming note
      for (const note of upcomingNotes) {
        await this.sendNotification(note);
        // Mark as notified
        note.notified = true;
        await note.save();
      }

      // Check for overdue tasks
      const overdueNotes = await Note.find({
        deadline: { $lt: now },
        done: false,
        overdue: false,
      });

      // Mark tasks as overdue and send notifications
      for (const note of overdueNotes) {
        note.overdue = true;
        await note.save();
        await this.sendOverdueNotification(note);
      }
    } catch (error) {
      console.error("Error checking deadlines:", error);
    }
  }

  async sendNotification(note) {
    try {
      // Get the user associated with the note
      const user = await note.populate("user");

      // Calculate time remaining
      const timeRemaining = moment(note.deadline).fromNow();

      // Create notification message
      const message = {
        userId: user._id,
        title: "Upcoming Deadline",
        message: `Task "${note.description}" is due ${timeRemaining}`,
        deadline: note.deadline,
        noteId: note._id,
      };

      // Store notification in database (you'll need to create a Notification model)
      // await Notification.create(message);

      // For now, we'll just log the notification
      console.log("Notification:", message);

      // In a real implementation, you would:
      // 1. Send email notification
      // 2. Send push notification
      // 3. Update frontend in real-time using WebSocket
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  }

  async sendOverdueNotification(note) {
    try {
      const user = await note.populate("user");

      const message = {
        userId: user._id,
        title: "Overdue Task",
        message: `Task "${note.description}" is overdue! You are late!`,
        deadline: note.deadline,
        noteId: note._id,
        overdue: true,
      };

      console.log("Overdue Notification:", message);
    } catch (error) {
      console.error("Error sending overdue notification:", error);
    }
  }
}

module.exports = new ReminderService();
