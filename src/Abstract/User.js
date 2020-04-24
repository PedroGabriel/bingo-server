import { keyer } from "@/Libs";

class AbstractUser {
  namespace = "user";
  app;
  ws;

  id; // uuid
  key; // redis/pub/sub key
  name; // user name

  room; // the current user this user is
  party; // party this user belongs to

  get data() {
    return {
      [this.namespace]: {
        id: this.id,
        name: this.name,
      },
    };
  }

  constructor(App, ws) {
    this.app = App;
    this.ws = ws;

    this.id = ws.id;
    this.name = ws.name;
    this.key = keyer(this.namespace, this.id);
    this.app.users[this.id] = this;
  }

  remove = (user) => {
    user = user ?? this.app.users[this.id];
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

export default AbstractUser;
