const { botSchema } = require("../database/schema/botSchema");

module.exports = async (req, res, next) => {
  const id = req.params.id;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: {
        code: "id_param_missing",
        message: "Could not found id param.",
      },
    });
  }

  const bot = await botSchema
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

  req.bot = bot;
  return next();
};
