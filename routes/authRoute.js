const express = require("express");
const route = express.Router();
const passport = require("../auth/passport");

route.get("/discord", passport.authenticate("discord"));
route.get(
  "/discord/callback",
  passport.authenticate("discord"),
  (req, res, next) => {
    res.redirect(
      `exp://yrqrg4s.lawyn.19000.exp.direct:80/--/profile?token=${req.user.token}`
    );
  }
);

module.exports = route;
