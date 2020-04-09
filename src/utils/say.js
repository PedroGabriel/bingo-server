const encoder = require("./encoder.js");

module.exports = {
  to: (ws, msg) => {
    ws.send(encoder.encode(msg));
  },
  all: (app, msg) => {
    app.publish("announce", encoder.encode(msg));
  },
  room: (app_ws, room, msg) => {
    app_ws.publish(room, encoder.encode(msg));
  },
};
