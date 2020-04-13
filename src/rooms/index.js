const rooms = {};
const normalizedPath = require("path").join(__dirname, "./");

require("fs")
  .readdirSync(normalizedPath)
  .forEach(function (file) {
    if (file == "index.js") return;
    rooms[file.replace(".js", "")] = require("./" + file);
  });

module.exports = rooms;
