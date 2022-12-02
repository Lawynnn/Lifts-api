const express = require("express");
const config = require("../config.json");
const route = express.Router();
// DEFAULT ROUTE "/api/v1/bot/:id/command"

route.get("/", async (req, res, next) => {
  const bot = req.bot;

  if (!bot) {
    return res.status(400).json({
      success: false,
      error: {
        code: "bot_not_found",
        message: "You dont own this bot or no longer exists",
      },
    });
  }

  let foldered = [];
  bot.folders.forEach((folder) => {
    foldered.push({
      name: folder.name,
      cmds: bot.commands
        .map((cmd) => (cmd.folder === folder.name ? cmd : null))
        .filter((cmd) => cmd != null),
    });
  });

  res.status(200).json({ success: true, data: foldered.reverse() });
});

route.post("/", async (req, res, next) => {
  let name = req.body.name || "";
  let trigger = req.body.trigger || "";
  let script = req.body.script || "";
  let folder = req.body.folder || "~default~";
  const bot = req.bot;

  if (bot.commands.length > req.user.tier.maxBotCommands) {
    return res.status(400).json({
      success: false,
      error: {
        code: "commands_limit",
        message: `You have gain commands limit of ${req.user.tier.maxBotCommands}.`,
      },
    });
  }

  if (!bot.folders.find((f) => f.name === folder)) {
    return res.status(400).json({
      success: false,
      error: {
        code: "invalid_folder",
        message:
          "Could not find any folder with this name to put command into.",
      },
    });
  }

  if (
    name.length > config.commands.max_name_length ||
    name.length < config.commands.min_name_length
  ) {
    return res.status(400).json({
      success: false,
      error: {
        code: "invalid_param_name",
        message: "This param dont respect the length rule.",
        min: config.commands.min_name_length,
        max: config.commands.max_name_length,
      },
    });
  }

  if (
    trigger.length > config.commands.max_trigger_length ||
    trigger.length < config.commands.min_trigger_length
  ) {
    return res.status(400).json({
      success: false,
      error: {
        code: "invalid_param_trigger",
        message: "This param dont respect the length rule.",
        min: config.commands.min_trigger_length,
        max: config.commands.max_trigger_length,
      },
    });
  }

  if (
    script.length > config.commands.max_script_length ||
    script.length < config.commands.min_script_length
  ) {
    return res.status(400).json({
      success: false,
      error: {
        code: "invalid_param_script",
        message: "This param dont respect the length rule.",
        min: config.commands.min_script_length,
        max: config.commands.max_script_length,
      },
    });
  }

  bot.commands.push({
    name,
    trigger,
    script,
    folder,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  bot.updatedAt = new Date();
  bot.save();
  res.status(200).json({
    success: true,
    data: {
      name,
      trigger,
      script,
      folder: folder === "~default~" ? "none" : folder,
      createdAt: new Date().getTime(),
      updatedAt: new Date().getTime(),
    },
  });
});

route.post("/:cmd", (req, res, next) => {
  const id = req.params.cmd;

  let name = req.body.name;
  let trigger = req.body.trigger;
  let script = req.body.script;
  let folder = req.body.folder;
  const bot = req.bot;

  if (!bot.commands.find((cmd) => cmd._id.toString() === id)) {
    return res.status(400).json({
      success: false,
      error: {
        code: "invalid_command",
        message: "Could not find any command with this id.",
      },
    });
  }

  if (folder && !bot.folders.find((f) => f.name === folder)) {
    return res.status(400).json({
      success: false,
      error: {
        code: "invalid_folder",
        message:
          "Could not find any folder with this name to put command into.",
      },
    });
  }

  if (name && name.length > config.commands.max_name_length) {
    return res.status(400).json({
      success: false,
      error: {
        code: "invalid_param_name",
        message: "This param dont respect the length rule.",
        min: config.commands.min_name_length,
        max: config.commands.max_name_length,
      },
    });
  }

  if (trigger && trigger.length > config.commands.max_trigger_length) {
    return res.status(400).json({
      success: false,
      error: {
        code: "invalid_param_trigger",
        message: "This param dont respect the length rule.",
        min: config.commands.min_trigger_length,
        max: config.commands.max_trigger_length,
      },
    });
  }

  if (script && script.length > config.commands.max_script_length) {
    return res.status(400).json({
      success: false,
      error: {
        code: "invalid_param_script",
        message: "This param dont respect the length rule.",
        min: config.commands.min_script_length,
        max: config.commands.max_script_length,
      },
    });
  }

  const command = bot.commands.find((cmd) => cmd._id.toString() === id);
  command.name = name;
  command.trigger = trigger;
  command.script = script;
  if (folder) command.folder = folder;
  command.updatedAt = new Date();
  bot.save();

  res.status(200).json({
    success: true,
    data: {
      name,
      trigger,
      script,
      folder: folder === "~default~" ? "none" : folder,
      updatedAt: new Date().getTime(),
    },
  });
});

module.exports = route;
