const RegisterController = require("./Controllers/RegisterController");
const authController = require("./Controllers/authController");
const noteRoutes = require("./Routes/noteRoutes");
const express = require("express");
const mongo = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const reminderService = require("./utils/reminderService");

// Load environment variables
dotenv.config();

// Verify JWT configuration
if (!process.env.JWT_SECRET) {
  console.error(
    "FATAL ERROR: JWT_SECRET is not defined in environment variables"
  );
  process.exit(1);
}

// Verify reCAPTCHA configuration
if (!process.env.RECAPTCHA_SECRET_KEY) {
  console.error(
    "FATAL ERROR: RECAPTCHA_SECRET_KEY is not defined in environment variables"
  );
  process.exit(1);
}

const RegisterRouter = require("./Routes/RegisterRoute");
const app = express();

// MongoDB connection
mongo
  .connect(
    "mongodb+srv://ashvinmk1:mnbE7OmB337h9l1t@cluster0.x3lp17j.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      ssl: true,
      sslValidate: true,
      sslCA: undefined,
    }
  )
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// Session configuration
app.use(
  session({
    secret: process.env.JWT_SECRET, // Using same secret as JWT for consistency
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl:
        "mongodb+srv://ashvinmk1:mnbE7OmB337h9l1t@cluster0.x3lp17j.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
      ttl: 24 * 60 * 60, // 24 hours
    }),
    cookie: {
      secure: process.env.NODE_ENV === "production", // true in production
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: "strict",
    },
  })
);

// Routes
app.use("/App", RegisterRouter);
app.use("/api/v1/notes", authController.protect, noteRoutes);

// Serve static files from Public directory
app.use(express.static("./Public"));

// Serve todo app static files
app.use("/todo", express.static(path.join(__dirname, "frontend/app")));

// Serve assets
app.use("/assets", express.static(path.join(__dirname, "frontend/app/assets")));

// Middleware to check if user is logged in (using both JWT and session)
const isAuthenticated = (req, res, next) => {
  // Check JWT token
  const token = req.headers.authorization?.split(" ")[1];
  // Check session
  const hasSession = req.session && req.session.user;

  if (!token && !hasSession) {
    return res.redirect("/login.html");
  }
  next();
};

// Protected routes
app.get("/todo", isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, "frontend/app/index.html"));
});

// Public routes
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/Public/index.html");
});

app.get("/login.html", (req, res) => {
  res.sendFile(__dirname + "/Public/login.html");
});

app.get("/register.html", (req, res) => {
  res.sendFile(__dirname + "/Public/register.html");
});

// Logout route
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.log(err);
    }
    res.redirect("/login.html");
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  console.error("Error details:", err);

  if (process.env.NODE_ENV === "development") {
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  } else {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }
});

const PORT = process.env.PORT || 2000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log("JWT_SECRET is configured:", !!process.env.JWT_SECRET);

  // Start the reminder service
  reminderService.start();
  console.log("Reminder service started");
});
