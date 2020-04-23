const routes = {};
const normalizedPath = require("path").join(__dirname, "./");

require("fs")
  .readdirSync(normalizedPath)
  .forEach(function (file) {
    if (file == "index.js") return;
    let route = require("./" + file).default;
    routes[route.name] = { ...route };
  });

module.exports = routes;
