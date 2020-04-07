const rooms = {};
const normalizedPath = require("path").join(__dirname, "./");

require("fs")
  .readdirSync(normalizedPath)
  .forEach(function(file) {
    if (file == "index.js") return;
    let room = require("./" + file);
    rooms[room.name] = { ...room };
  });

module.exports = rooms;
