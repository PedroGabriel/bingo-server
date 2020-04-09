const { db, say } = require("../utils");
const room = "main";
module.exports = {
  name: room,
  open: (app, ws, req) => {},
  message: (app, ws, msg, isBinary) => {
    console.log("fora", ws.id + ": " + msg);
  },
  close: (app, ws, code, msg) => {},
};
