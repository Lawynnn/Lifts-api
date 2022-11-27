const express = require("express");
const session = require("express-session");
const passport = require("passport");
const cparser = require("cookie-parser");
const database = require("./database");
const store = require("connect-mongo");
const cors = require("cors");
require("dotenv").config();

const app = express()
  .set("port", process.env.PORT || 8080)
  .use(express.urlencoded({ extended: true }))
  .use(express.json())
  .use(
    session({
      secret: process.env.SESSION_TOKEN,
      saveUninitialized: true,
      cookie: { maxAge: 1000 * 60 * 60 * 24 },
      resave: false,
      store: store.create(database.connection),
    })
  )
  .use(cors({ credentials: true, origin: true }))
  .use(passport.initialize())
  .use(passport.session())
  .use(express.static("./public"))
  .use(cparser())
  .use("/api/v1/bot", require("./routes/botRoute"))
  .use("/api/v1/auth", require("./routes/authRoute"))
  .use("/api/v1/user", require("./routes/userRoute"));

app.listen(app.get("port"), () => {
  console.log(`Listening on port ${app.get("port")}`);
});
