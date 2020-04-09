const { readJson } = require("../utils");
const auth = require("../auth.js");

module.exports = {
  name: "logout",
  path: "/logout",
  type: "get",
  page: (res, req) => {
    res.writeHeader("Content-Type", "application/json");
    auth.logout(res).then(() => {
      res.end(JSON.stringify({ status: true }));
    });
  },
};
