const UsersRouter = require("express").Router();
const User = require("./users.model");
const { Types } = require("mongoose");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");


// JWT secret key
const JWT_SECRET = "your_jwt_secret_key";

// Nodemailer transport configuration
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "jijinktr@gmail.com", // Your email
    pass: "bkfi bmbw ankb nnvd", // Your email password or App password
  },
});

// 1. Create a new user (Sign Up)
// http://localhost:3000/users/
UsersRouter.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = new User({
      name,
      email,
      password: hashedPassword, // Save hashed password
    });

    await newUser.save();

    return res
      .status(201)
      .json({ message: "User created successfully", user: newUser });
  } catch (error) {
    console.error("Error signing up user", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// 2. Get All Users
// http://localhost:3000/users/
UsersRouter.get("/", async (req, res) => {
  try {
    const response = await User.find();
    return res.json({
      message: "Users fetched successfully",
      data: response,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong",
      error,
    });
  }
});

// 3. Get a user by ID
// http://localhost:3000/users/user/:userId
UsersRouter.get("/user/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const response = await User.findOne({
      _id: new Types.ObjectId(userId),
    });
    if (response) {
      return res.status(200).json({
        message: "User fetched successfully",
        data: response,
      });
    } else {
      return res.status(404).json({
        message: "No User found",
        data: {},
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong",
      error,
    });
  }
});

// 4. Update a user by ID
// http://localhost:3000/users/update/:userId
UsersRouter.patch("/update/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const response = await User.findOneAndUpdate(
      {
        _id: new Types.ObjectId(userId),
      },
      {
        $set: req.body,
      },
      {
        new: true,
        projection: {
          _id: 0,
        },
      }
    );
    if (!response) {
      return res.status(404).json({
        message: "Failed updating user! No User found",
      });
    } else {
      return res.json({
        message: "User updated successfully",
        data: response,
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

// 5. Delete a user by ID
// http://localhost:3000/users/delete/:userId
UsersRouter.delete("/delete/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const response = await User.findOneAndDelete({
      _id: new Types.ObjectId(userId),
    });
    if (!response) {
      return res.status(404).json({
        message: "Failed deleting user! No User found",
      });
    } else {
      return res.json({
        message: "User deleted successfully",
        data: response,
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

// 6. Verify email and generate JWT token
// http://localhost:3000/users/verify-email
UsersRouter.post("/verify-email", async (req, res) => {
  const { email } = req.body;

  try {
    // Check if the user exists in the database
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, {
      expiresIn: "30d", 
    });
      console.log(JWT_SECRET);

    // Save the token in the user's database
    user.token = token;
    await user.save();

    // Send verification email
    const mailOptions = {
      from: "jijinktr@gmail.com",
      to: user.email,
      subject: "Verify Your Email",
      text: `Please verify your email by clicking the following link: https://reset-pw-flow.netlify.app/verify/${token}`,
    };
      console.log(mailOptions);

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return res.status(500).json({ message: "Failed to send email" });
      }
      res.json({ message: "Verification email sent successfully!" });
    });
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong",
      error: error.message,
    });
  }
});

// 7. Verify token and redirect to password reset page
// http://localhost:5000/users/verify/:token
UsersRouter.get("/verify/:token", async (req, res) => {
  const { token } = req.params;

  try {
    // Verify the JWT token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Check if the user exists and the token matches
    const user = await User.findOne({ _id: decoded.id, token });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    // Update the isTokenValid field
    user.isTokenValid = true;
    await user.save();

    // Token is valid, send success response
    return res.status(200).json({
      message:
        "Token verified successfully! Redirecting to password reset page",
      redirectUrl: `https://reset-pw-flow.netlify.app/reset-password/${token}`, // Replace with your frontend URL
    });
  } catch (error) {
    // Handle errors (e.g., invalid token, expired token)
    return res.status(400).json({
      message: "Token verification failed or token has expired",
      error: error.message,
    });
  }
});



// 8. Reset password after token verification
// http://localhost:5000/users/reset-password/:token
UsersRouter.post("/reset-password/:token", async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  if (!newPassword) {
    return res.status(400).json({ message: "New password is required" });
  }

  try {
    // Verify the JWT token
    const decoded = jwt.verify(token, JWT_SECRET);
    

    // Check if the user exists and the token matches
    const user = await User.findOne({ _id: decoded.id, token });
    

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password and clear the token
    user.password = hashedPassword;
    user.token = null; // Clear the token after successful password reset
    await user.save();

    return res.status(200).json({ message: "Password reset successful!" });
  } catch (error) {
    return res.status(400).json({
      message: "Password reset failed",
      error: error.message,
    });
  }
});


module.exports = UsersRouter;
