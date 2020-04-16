const { readJson } = require("../Libs");
const Auth = require("../Auth.js");

module.exports = {
  name: "guest",
  path: "/guest",
  type: "post",
  page: (res, req) => {
    res.writeHeader("Content-Type", "application/json");
    readJson(res, (obj) => {
      Auth.guest(res)
        .then((user) => {
          res.end(JSON.stringify(user));
        })
        .catch((msg) => {
          res.end(msg);
        });
    });
  },
};
