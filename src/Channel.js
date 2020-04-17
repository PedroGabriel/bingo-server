const { uuid, encoder } = require("./Libs");
class Channel {
  app = null;

  channels = {}; // all channels this party belongs to key:Channel

  say = (key, message) => this.ws.publish(key, encoder.encode(message));

  constructor(app, ws) {
    this.app = app;

    this.id = uuid();
    this.key = `party:${this.id}`;
  }
}

module.exports = Channel;
