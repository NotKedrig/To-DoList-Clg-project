const Fields = require("./../Models/registerModle");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const querystring = require("querystring");

const signToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

exports.registerUser = catchAsync(async (req, res, next) => {
  const newuser = await Fields.create({
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  const token = signToken(newuser._id);

  res.status(201).json({
    status: "success",
    message: "Signed up successfully",
    token,
    user: {
      id: newuser._id,
      email: newuser.email,
    },
  });
});

exports.login = catchAsync(async (req, res, next) => {
  try {
    const { email, password, captchaResponse } = req.body;
    console.log("Received CAPTCHA response:", captchaResponse);
    console.log("Using secret key:", process.env.RECAPTCHA_SECRET_KEY);

    if (!captchaResponse) {
      return next(
        new AppError("Please complete the CAPTCHA verification", 400)
      );
    }

    try {
      const postData = querystring.stringify({
        secret: process.env.RECAPTCHA_SECRET_KEY,
        response: captchaResponse,
      });

      console.log("Sending CAPTCHA verification request...");
      const response = await axios.post(
        "https://www.google.com/recaptcha/api/siteverify",
        postData,
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Content-Length": postData.length,
          },
        }
      );

      console.log(
        "Full CAPTCHA verification response:",
        JSON.stringify(response.data, null, 2)
      );

      if (!response.data.success) {
        console.log(
          "CAPTCHA verification failed. Error codes:",
          response.data["error-codes"]
        );
        return next(
          new AppError(
            `CAPTCHA verification failed: ${
              response.data["error-codes"]?.join(", ") || "Unknown error"
            }`,
            400
          )
        );
      }
    } catch (error) {
      console.error(
        "CAPTCHA verification error:",
        error.response?.data || error.message
      );
      if (error.response) {
        console.error("Error response data:", error.response.data);
        console.error("Error response status:", error.response.status);
        console.error("Error response headers:", error.response.headers);
      }
      return next(
        new AppError("Error verifying CAPTCHA. Please try again.", 500)
      );
    }

    if (!email || !password) {
      return next(new AppError("Please provide email and password", 400));
    }

    const user = await Fields.findOne({ email: email }).select("+password");
    console.log("Found user:", user ? "yes" : "no");

    if (!user) {
      return next(new AppError("No user found with this email", 401));
    }

    const isPasswordCorrect = await user.correctPassword(
      password,
      user.password
    );
    console.log("Password correct:", isPasswordCorrect);

    if (!isPasswordCorrect) {
      return next(new AppError("Incorrect password", 401));
    }

    const token = signToken(user._id);
    console.log("Token generated successfully");

    res.status(200).json({
      status: "success",
      message: "Logged in successfully",
      token,
      user: {
        id: user._id,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error details:", error);
    if (
      error.message === "JWT_SECRET is not defined in environment variables"
    ) {
      return next(new AppError("Server configuration error", 500));
    }
    return next(
      new AppError(error.message || "An error occurred during login", 500)
    );
  }
});
