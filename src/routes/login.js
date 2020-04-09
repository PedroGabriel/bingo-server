const { readJson } = require("../utils");
const auth = require("../auth.js");

module.exports = {
  name: "login",
  path: "/login",
  type: "post",
  page: (res, req) => {
    res.writeHeader("Content-Type", "application/json");
    readJson(res, (obj) => {
      auth
        .login(res, obj.email, obj.password)
        .then((user) => {
          res.end(JSON.stringify(user));
        })
        .catch((msg) => {
          res.end(msg);
        });
    });
  },
};
