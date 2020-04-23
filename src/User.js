import { keyer } from "@/Libs";

class User {
  app = null;
  ws = null;
  prefix = "user";

  id = null; // uuid
  key = ""; // redis/pub/sub key
  name = "";

  channels = {}; // all channels this users ins connected key:Channel
  party = null; // party this user belongs to

  actions = {};
  static actions = this.action;

  get data() {
    return {
      user: {
        id: this.id,
        name: this.name,
      },
    };
  }

  constructor(app, ws) {
    this.app = app;
    this.ws = ws;

    this.id = ws.id;
    this.name = ws.name;
    this.key = keyer(this.prefix, this.id);
    this.app.users[ws.id] = this;
  }

  remove = (user) => {
    user = user ? user : this.app.users[this.id];
    delete this.app.users[user.id];
    return true;
  };
  static remove = this.remove;

  do = (payload) => {
    this.ws.send(payload);
    return this;
  };

  say = (key, state, action, payload, extras = {}) => {
    console.log("user say to all at", key);
    this.ws.sendAll(key, {
      state,
      action,
      ...this.data,
      payload,
      ...extras,
    });
    return this;
  };

  sub = (key) => {
    this.ws.subscribe(key);
    return this;
  };
  unsub = (key) => {
    this.ws.unsubscribe(key);
    return this;
  };
  unsubAll = () => {
    this.ws.unsubscribeAll();
    return this;
  };
}

export default User;
