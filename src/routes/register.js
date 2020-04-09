const { readJson } = require("../utils");
const auth = require("../auth.js");

module.exports = {
  name: "register",
  path: "/register",
  type: "post",
  page: (res, req) => {
    res.writeHeader("Content-Type", "application/json");
    readJson(res, (obj) => {
      auth
        .register(res, obj.name, obj.email, obj.password)
        .then((user) => {
          res.end(JSON.stringify(user));
        })
        .catch((msg) => {
          res.end(msg);
        });
    });
  },
};
