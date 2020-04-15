const Rooms = {};
const normalizedPath = require("path").join(__dirname, "./");

require("fs")
  .readdirSync(normalizedPath)
  .forEach(function (file) {
    if (file == "index.js") return;
    Rooms[file.replace(".js", "")] = require("./" + file);
  });

module.exports = Rooms;
