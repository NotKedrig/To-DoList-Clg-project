var express = require("express");
var app = express();
var items = require("./data/items");
var port = process.env.PORT || 3000;
var path = require("path");

app.get("/items", function (req, res) {
  res.json(items);
});

app.use(express.static("./app"));
app.use("/todo", express.static(path.join(__dirname, "frontend/app")));

app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, "app/index.html"));
});

app.listen(port, function () {
  console.log("App running on port " + port);
});
