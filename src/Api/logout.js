const { readJson } = require("../Utils");
const Auth = require("../Auth.js");

module.exports = {
  name: "logout",
  path: "/logout",
  type: "get",
  page: (res, req) => {
    res.writeHeader("Content-Type", "application/json");
    Auth.logout(res).then(() => {
      res.end(JSON.stringify({ status: true }));
    });
  },
};
