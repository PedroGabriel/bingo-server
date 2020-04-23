const libs = {};

const normalizedPath = require("path").join(__dirname, ".");
require("fs")
  .readdirSync(normalizedPath)
  .forEach(function (file) {
    if (file == "index.js") return;
    libs[file.replace(".js", "")] = require("./" + file).default;
  });

module.exports = libs;
