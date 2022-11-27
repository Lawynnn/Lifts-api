const mongoose = require("mongoose");

const url =
  "mongodb+srv://lawyn:Papameu123!@cluster0.px8nd.mongodb.net/?retryWrites=true&w=majority";
mongoose
  .connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: "Lifts",
  })
  .then((db) => {
    console.log("Database listening on " + db.connection.name);
  });

module.exports = mongoose;
