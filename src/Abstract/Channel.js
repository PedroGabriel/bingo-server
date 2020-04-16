const { uuid, db } = require("../Libs");

class Channel {
  #id = ""; // The unique id
  #key = ""; // The current db key name
  #name = ""; // The unique channel name
  #app = null; // ws server

  #state = ""; // Current channel state
  #stateless = ""; // Current channel key without state

  #users = {}; // All users inside this channel
  #users_count = 0; // Total users inside this channel

  #party = null; // If this is a party channel, party object

  #states = {
    open: "open",
    closed: "closed",
    full: "full",
  };

  #options = {};

  constructor(app, name, party = null, options = {}) {
    this.#id = uuid();
    this.#app = app;
    this.#name = name;
    this.#options = options;
    this.#setParty(party);
    this.#setKey(this.#party);

    this.#init(this.#key, this.#party, this.#options);
  }

  say = (message) => this.#app.publish(this.#key, message);

  join = (user) => {
    if (this.#state != this.#states.open) return false;

    if (this.#addUser(user) && this.#options.announce)
      user.say(this.#key, { j: user.name, t: this.#users_count });

    return true;
  };

  leave = (user) => {
    if (this.#removeUser(user) && this.#options.announce)
      this.say({ l: user.name, t: this.#users_count });
  };

  remove = () => db.del(this.#key);
  open = () => {
    if (this.#options.max_users && this.#users_count >= this.#options.max_users)
      this.#setState(this.#states.full);
    else this.#setState(this.#states.open);
  };
  close = () => this.#setState(this.#states.closed);

  #init = () => {
    this.#setState(this.#states.open);

    db.hmset(this.#key, {
      key: this.#key,
      id: this.#id,
      name: this.#name,
      party: this.#party ? this.#party.id : null,
      options: this.#options,
      created_at: unix.now(),
      state: this.#state,
    });
  };

  #setKey = (party = null) => {
    let key = `channel:${this.#name}`;

    if (!this.#options.single) key += `:${this.#id}`;

    if (party) key += `:party:${party.id}`;
    else key += `:online`;

    this.#key = key;
    this.#stateless = key;
    return key;
  };

  #setState = (state) => {
    this.#state = state;
    let key = `${this.#stateless}:${state}`;
    db.rename(this.#key, key);
    this.#key = key;
  };

  #setParty = (party = null) => {
    if (!party) return;
    this.#party = party;
  };

  #removeUser = (user) => {
    if (!this.#users[user.id]) return false;
    user.unsub(this.#key);
    delete this.#users[user.id];
    this.#users_count--;
    if (this.#state == this.#states.full) {
      if (
        this.#options.max_users &&
        this.#users_count < this.#options.max_users
      )
        this.#setState(this.#states.open);
    }
    return true;
  };

  #addUser = (user) => {
    if (this.#users[user.id]) return false;
    user.sub(this.#key);
    this.#users[user.id] = user;
    this.#users_count++;
    if (this.#state == this.#states.open) {
      if (
        this.#options.max_users &&
        this.#users_count >= this.#options.max_users
      )
        this.#setState(this.#states.full);
    }
    return true;
  };
}

module.exports = Channel;
