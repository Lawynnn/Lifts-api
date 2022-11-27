const CryptoJS = require("crypto-js");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
const config = require("../config.json");
const express = require("express");
const route = express.Router();
// DEFAULT ROUTE "/api/v1/bot"

const Auth = require("../auth/mw");
const { botSchema } = require("../database/schema/botSchema");

route.get("/", Auth, async (req, res, next) => {
  const bots = await botSchema.find({ owner: req.user.discord.id });
  res.status(200).json({
    success: true,
    data: [...bots],
  });
});

const createBotCheck = async (req, res, next) => {
  let token = req.body.token;
  if (!token) {
    return res.status(400).json({
      success: false,
      error: {
        code: "token_missing",
        message: "Your token is missing.",
      },
    });
  }
  req.token = token;

  let bots = await botSchema.find({ owner: req.user.discord.id });
  if (bots.length > req.user.tier.maxBots) {
    return res.status(400).json({
      success: false,
      error: {
        code: "bot_limit",
        message: `You have gain bot limit of ${req.user.tier.maxBots}`,
      },
    });
  }

  for (const bot of bots) {
    const decryptedToken =
      CryptoJS.AES.decrypt(bot.token, process.env.CRYPTO_TOKEN).toString(
        CryptoJS.enc.Utf8
      ) || null;
    if (decryptedToken === req.token) {
      return res.status(400).json({
        success: false,
        error: {
          code: "bot_duplicated",
          message: "You already have an bot using this token.",
        },
      });
    }
  }

  const discordClient = await fetch(`https://discord.com/api/v6/users/@me`, {
    method: "GET",
    headers: {
      Authorization: `Bot ${req.token}`,
    },
  })
    .then((r) => r.json())
    .catch((e) => null);

  if (!discordClient || (discordClient && discordClient.code === 0)) {
    return res.status(400).json({
      success: false,
      error: {
        code: "invalid_bot_token",
        message: "You provided an invalid token for the bot.",
      },
    });
  }

  console.log(discordClient);

  req.data = discordClient;

  return next();
};
route.post("/", Auth, createBotCheck, async (req, res, next) => {
  let encrypedToken = CryptoJS.AES.encrypt(
    req.token,
    process.env.CRYPTO_TOKEN
  ).toString();
  let bot = new botSchema({
    token: encrypedToken,
    owner: req.user.discord.id,
    data: {
      id: req.data.id,
      username: req.data.username,
      discriminator: req.data.discriminator,
      avatar: req.data.avatar
        ? `https://cdn.discordapp.com/avatars/${req.data.id}/${req.data.avatar}.png`
        : config.bots.default_avatar,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdAtMine: new Date(),
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    folders: [
      {
        name: "~default~",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    commands: [
      {
        name: "My first command",
        trigger: "!ping",
        script: "Pong!",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    variables: [
      {
        name: "Doggo",
        createdAt: new Date(),
        updatedAt: new Date(),
        value: {
          global: "Ham",
          servers: [],
          users: [],
        },
      },
    ],
  });
  await bot.save();
  res.status(200).json({
    success: true,
    data: bot,
  });
});

module.exports = route;
