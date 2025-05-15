const jwt = require("jsonwebtoken");
const User = require("../Models/registerModle");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};
const createSendToken = (user, statusCode, req, res) => {
  const token = signToken(user._id);

  res.setHeader("Authorization", `Bearer ${token}`);

  if (req.session) {
    req.session.userId = user._id;
  }

  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

exports.protect = async (req, res, next) => {
  try {
    
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    const hasSession = req.session && req.session.userId;

    if (!token && !hasSession) {
      return res.status(401).json({
        status: "fail",
        message: "You are not logged in! Please log in to get access.",
      });
    }

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return res.status(401).json({
          status: "fail",
          message: "The user belonging to this token no longer exists.",
        });
      }
      req.user = currentUser;
    } else if (hasSession) {
      
      const currentUser = await User.findById(req.session.userId);
      if (!currentUser) {
        return res.status(401).json({
          status: "fail",
          message: "Session expired. Please log in again.",
        });
      }
      req.user = currentUser;
    }

    next();
  } catch (err) {
    console.error("Auth error:", err);
    return res.status(401).json({
      status: "fail",
      message: "Invalid token or session. Please log in again.",
    });
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        status: "fail",
        message: "Please provide email and password!",
      });
    }
    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await user.correctPassword(password, user.password))) {
      return res.status(401).json({
        status: "fail",
        message: "Incorrect email or password",
      });
    }

    createSendToken(user, 200, req, res);
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({
      status: "error",
      message: "An error occurred during login",
    });
  }
};

exports.logout = (req, res) => {
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        console.error("Session destroy error:", err);
      }
    });
  }
  res.setHeader("Authorization", "");

  res.status(200).json({
    status: "success",
    message: "Logged out successfully",
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  createSendToken(newUser, 201, req, res);
});
