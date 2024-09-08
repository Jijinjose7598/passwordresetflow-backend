const mongoose = require("mongoose");
const { Types } = require("mongoose");

const UserSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: false,
    },
    email: {
      type: String,
      unique: true,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    token: {
      type: String, // Store the JWT token as a string
    },
    isTokenValid: {
      type: Boolean,
      default:false,
    },
    dob: {
      type: Date,
      required: false,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    isSuperAdmin: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = UserSchema;
