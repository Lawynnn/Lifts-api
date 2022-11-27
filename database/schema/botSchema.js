const mongoose = require("mongoose");

module.exports.botSchema = mongoose.model(
  "bots",
  new mongoose.Schema({
    owner: String,
    token: String,
    hostingEnd: {
      type: Date,
      default: Date.now,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    data: {
      id: String,
      username: String,
      discriminator: String,
      avatar: String,
    },
    folders: [
      {
        name: String,
      },
    ],
    commands: [
      {
        name: {
          type: String,
          default: "My first command",
        },
        trigger: {
          type: String,
          default: "!ping",
        },
        script: {
          type: String,
          default: "Pong!",
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
        updatedAt: {
          type: Date,
          default: Date.now,
        },
        folder: {
          type: String,
          default: "~default~",
        },
        position: {
          type: Number,
          default: 0,
          min: 0,
        },
      },
    ],
    variables: [
      {
        name: {
          type: String,
          default: "Dogo",
        },
        value: {
          global: {
            type: String,
            value: "Ham",
          },
          servers: [],
          users: [],
        },
        createdAt: {
          type: Date,
          default: new Date(),
        },
      },
    ],
  })
);
