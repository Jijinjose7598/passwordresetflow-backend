const express = require("express");
const bodyparser = require("body-parser");
const cors = require("cors");
const { initialize_mongo_connectivity } = require("./database/connections");

const server = express();

server.use(
  cors({
    origin: "*",
  })
);

server.use(bodyparser.json());

server.use("/users", require("./modules/users/users.controller"));
server.use("/auth", require("./modules/auth/auth.controller"));


// Error handling middleware
server.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).send("Something went wrong!");
});

server.listen(5000, "0.0.0.0", () => {
  console.log("Server started on http://localhost:5000");
  initialize_mongo_connectivity();
});
