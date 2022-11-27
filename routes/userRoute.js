const express = require("express");
const route = express.Router();
// DEFAULT ROUTE "/api/v1/user"

const Auth = require("../auth/mw");

route.get("/", Auth, async (req, res, next) => {
  res.status(200).json({
    success: true,
    data: req.user,
  });
});

module.exports = route;
