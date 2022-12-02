const CryptoJS = require("crypto-js");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
const config = require("../config.json");
const clientStore = require("../client");
const express = require("express");
const route = express.Router();
// DEFAULT ROUTE "/api/v1/bot"

const Auth = require("../auth/mw");
const { botSchema } = require("../database/schema/botSchema");

clientStore.on("client.add", (client, timeout, expire, id) => {
  console.log(client.user.tag + ` is running. (${id})`);
});
clientStore.on("client.end", (client) => {
  console.log(client.user.tag + " has ended.");
});

clientStore.on("client.remove", (client) => {
  console.log(`${client.user.tag} has removed`);
});

route.get("/", Auth, async (req, res, next) => {
  // console.log("Finding bots for ", req.user.discord.username);
  const bots = await botSchema.find({ owner: req.user.discord.id });
  res.status(200).json({
    success: true,
    data: [
      ...bots.map((bot) => {
        return {
          _id: bot._id,
          ...bot.data,
          commands: bot.commands.length,
          variables: bot.variables.length,
          active: clientStore.activeClients.has(bot._id.toString()),
        };
      }),
    ],
    clients: clientStore.activeClients.length,
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

route.post("/:id/host", Auth, async (req, res, next) => {
  const botId = req.params.id;
  const bot = await botSchema
    .findOne({ owner: req.user.discord.id, _id: botId })
    .catch((e) => null);

  if (!bot) {
    return res.status(400).json({
      success: false,
      error: {
        code: "bot_not_found",
        message: "You dont own this bot or no longer exists.",
      },
    });
  }
  if (new Date().getTime() < bot.hostingEnd) {
    return res.status(400).json({
      success: false,
      error: {
        code: "bot_host_one_time",
        message: "You cant host your bot for more than once time.",
        time_left: Math.floor(bot.hostingEnd - new Date().getTime()),
      },
    });
  }

  let now = new Date();
  let multiplier =
    now.getTime() < bot.hostingEnd ? bot.hostingEnd : now.getTime();
  let hostTime = new Date(multiplier);
  hostTime.setMinutes(hostTime.getMinutes() + 30);
  bot.hostingEnd = hostTime.getTime();
  const decryptedToken = CryptoJS.AES.decrypt(
    bot.token.toString(),
    process.env.CRYPTO_TOKEN
  ).toString(CryptoJS.enc.Utf8);
  let serverClient = await clientStore.add(
    decryptedToken,
    bot._id.toString(),
    hostTime.getTime()
  );
  if (!serverClient) {
    return res.status(400).json({
      success: false,
      error: {
        code: "invalid_bot_token",
        message: "Your bot token is invalid or your id doesnt match",
      },
    });
  }
  bot.updatedAt = new Date();
  await bot.save();
  res.status(200).json({
    success: true,
    data: {
      hostTime,
      hostEnd: bot.hostingEnd,
    },
  });
});

route.delete("/:id/host", Auth, async (req, res, next) => {
  const id = req.params.id;

  let bot = await botSchema
    .findOne({ owner: req.user.discord.id, _id: id })
    .catch((e) => null);
  if (!bot) {
    return res.status(400).json({
      success: false,
      error: {
        code: "bot_not_found",
        message: "You dont own this bot or no longer exists.",
      },
    });
  }

  if (new Date().getTime() > bot.hostingEnd) {
    return res.status(400).json({
      success: false,
      error: { code: "bot_host_one_time", message: "Bot its already stopped." },
    });
  }
  clientStore.remove(bot._id.toString());
  bot.hostingEnd = new Date();
  bot.updatedAt = new Date();
  await bot.save();
  res.status(200).json({
    success: true,
    clients: clientStore.activeClients.length,
  });
});

route.get("/:id/host", Auth, async (req, res, next) => {
  let id = req.params.id;

  let bot = await botSchema
    .findOne({ owner: req.user.discord.id, _id: id })
    .catch((e) => null);
  if (!bot) {
    return res.status(400).json({
      success: false,
      error: {
        code: "bot_not_found",
        message: "You dont own this bot or no longer exists.",
      },
    });
  }

  if (bot.hostingEnd > new Date()) {
    const diffTime = Math.abs(bot.hostingEnd - new Date());
    let seconds = Math.floor((diffTime / 1000) % 60);
    let minutes = Math.floor((diffTime / 1000 / 60) % 60);
    let hours = Math.floor((diffTime / 1000 / 60 / 60) % 24);
    let days = Math.floor((diffTime / 1000 / 60 / 60 / 24) % 7);
    let weeks = Math.floor(diffTime / 1000 / 60 / 60 / 24 / 7);

    return res.status(200).json({
      success: true,
      format: `${weeks > 0 ? weeks + "w " : ""}${days > 0 ? days + "d " : ""}${
        hours > 0 ? hours + "h " : ""
      }${minutes > 0 ? minutes + "m " : ""}${seconds + "s"}`,
      expired: false,
      timestamp: bot.hostingEnd.getTime(),
      time: {
        seconds: seconds,
        minutes: minutes,
        hours: hours,
        days: days,
        weeks: weeks,
      },
    });
  }
  res.status(200).json({
    success: true,
    format: `Expired`,
    expired: true,
  });
});

module.exports = route;
