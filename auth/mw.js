const { userSchema } = require("../database/schema/userSchema");

module.exports = async (req, res, next) => {
  const startTime = performance.now();
  const token = req.headers.authorization || null;

  const user = await userSchema.findOne({ token });
  if (user) {
    req.user = {
      _id: user._id.toString(),
      discord: {
        id: user.id,
        username: user.username,
        email: user.email,
        discriminator: user.discriminator,
        avatar: user.avatar,
        verified: user.verified,
        locale: user.locale,
      },
      dates: {
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLogin: user.lastLogin,
        executionTime:
          Math.abs(performance.now() - startTime).toFixed(3) + "ms",
      },
      tier: { ...user.tier },
    };
    return next();
  }

  res.status(401).json({
    success: false,
    error: {
      code: "unauthorized_user",
      message: "Your are not authorized yet.",
    },
  });
};
