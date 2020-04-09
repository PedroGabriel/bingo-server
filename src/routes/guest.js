const { readJson } = require("../utils");
const auth = require("../auth.js");

module.exports = {
  name: "guest",
  path: "/guest",
  type: "post",
  page: (res, req) => {
    res.writeHeader("Content-Type", "application/json");
    readJson(res, (obj) => {
      auth
        .guest(res)
        .then((user) => {
          res.end(JSON.stringify(user));
        })
        .catch((msg) => {
          res.end(msg);
        });
    });
  },
};
