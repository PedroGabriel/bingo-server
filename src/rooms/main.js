const { db, encoder, uuid } = require("../utils");

module.exports = {
  name: "main",
  open: (ws, req) => {
    ws.id = uuid();

    db.hmset(`users:${ws.id}`, { name: "test" });
    db.set(`connected:${ws.id}`, 1);

    ws.send(encoder.encode([1, 3, 2]));

    // ws.subscribe(id);
  },
  message: (ws, msg, isBinary) => {
    // console.log(ws.id + ": " + new TextDecoder("UTF-8").decode(msg));
    console.log(ws.id + ": " + encoder.decode(msg));
  },
  drain: (ws) => {
    console.log("WebSocket backpressure: " + ws.getBufferedAmount());
  },
  close: (ws, code, message) => {
    db.del(`users:${ws.id}`);
    db.del(`connected:${ws.id}`);
  },
};
