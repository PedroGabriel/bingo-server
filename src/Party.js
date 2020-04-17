const { uuid, encoder } = require("./Libs");

class Party {
  app = null;

  id = null; // uuid
  key = ""; // redis/pub/sub key

  users = {}; // all users inside this party
  channels = {}; // all channels this party belongs to key:Channel

  say = (key, message) => this.ws.publish(key, encoder.encode(message));

  constructor(app, User) {
    this.app = app;

    this.id = uuid();
    this.key = `party:${this.id}`;
    this.app.party[this.id] = this;

    this.join(User);
  }

  actions = {
    create: this.create,
  };
  static actions = this.action;

  static create = (app, User) => {
    new this(app, User);
  };

  remove = (Party = null) => {
    Party = Party ? Party : this.app.party[this.id];
    delete this.app.party[Party.id];
  };
  static remove = this.remove;

  join = (User) => {
    if (User.party) User.party.leave(User);
    this.say("joined", `${User.name} joined the party`);
    User.sub(this.key);
  };

  leave = (User) => {
    User.unsub(this.key);
    delete this.users[User.id];
    this.say("left", `${User.name} left the party`);
    if (this.isEmpty()) this.remove();
  };

  say = (action, msg, extras = {}) => {
    this.app.say(this.key, { state: "party", action, msg, ...extras });
  };

  isEmpty = () => {
    return (
      Object.keys(this.users).length === 0 && this.users.constructor === Object
    );
  };
}

module.exports = Party;
