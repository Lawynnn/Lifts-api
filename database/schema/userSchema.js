const mongoose = require("mongoose");

module.exports.userSchema = mongoose.model(
  "users",
  new mongoose.Schema({
    id: String,
    username: String,
    email: String,
    discriminator: String,
    avatar: String,
    verified: Boolean,
    locale: String,
    token: String,
    createdAt: {
      type: Date,
      default: new Date(),
    },
    updatedAt: {
      type: Date,
      default: new Date(),
    },
    lastLogin: {
      type: Date,
      default: new Date(),
    },
    tier: {
      maxBots: {
        type: Number,
        default: 5,
      },
      maxBotCommands: {
        type: Number,
        default: 80,
      },
      maxBotVariables: {
        type: Number,
        default: 130,
      },
      isPremiumUser: {
        type: Boolean,
        default: false,
      },
    },
  })
);
