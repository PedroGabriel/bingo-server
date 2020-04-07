const { auth, readJson } = require("../utils");

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
          const { uid, name } = { ...user };
          res.end(JSON.stringify({ uid, name }));
        })
        .catch(() => {
          res.end("No user found.");
        });
    });
  },
};
