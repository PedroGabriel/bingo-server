const { uuid, encoder } = require("./Libs");

class User {
  app = null;
  ws = null;

  id = null; // uuid
  key = ""; // redis/pub/sub key
  name = "";

  channels = {}; // all channels this users ins connected key:Channel

  actions = {};
  static actions = this.action;

  do = (message) => this.ws.send(encoder.encode(message));
  say = (key, message) => this.ws.publish(key, encoder.encode(message));

  sub = (key) => this.ws.subscribe(key);
  unsub = (key) => this.ws.unsubscribe(key);
  unsubAll = () => this.ws.unsubscribeAll();

  constructor(app, ws) {
    this.app = app;
    this.ws = ws;

    this.id = ws.id;
    this.name = ws.name;
    this.key = `user:${this.id}`;
    this.app.users[ws.id] = this;
  }

  static create = (app, ws) => {
    new this(app, ws);
  };

  remove = (user) => {
    user = user ? user : this.app.users[this.id];
    delete this.app.users[user.id];
  };
  static remove = this.remove;
}

module.exports = User;
