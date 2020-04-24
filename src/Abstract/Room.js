import { uuid, db, keyer } from "@/Libs";

class Room {
  namespace = "room";
  id; // The unique id
  key; // The current db key name (without state)
  dbKey; // Current room key without state
  name; // The unique room name
  app; // ws server

  users = {}; // All users inside this room
  usersCount = 0; // Total users inside this room

  party; // If this is a party room, party object

  states = {
    open: "open",
    closed: "closed",
    busy: "busy",
  };
  state; // Current room state
  full; // kinda obvious

  options = {
    // single: true, // If only a single room (sub) of this should exists
    // allowParty: false, // if a party room can be created
    // announce: true, // pub to room when new player join
    // lobby: '', // pub to this sub player join or state change
    // maxUsers: 0, // Max users in this room
    // minUsers: 1, // Min players to start the room logic running
    // canClose: false, // if this room can be set to closed to prevent users join
  };

  get data() {
    return {
      [this.namespace]: {
        id: this.id,
        maxUsers: this.maxUsers,
        usersCount: this.usersCount,
        state: this.state,
        full: this.full,
      },
    };
  }

  constructor(App, name, Party = null, options = {}) {
    this.id = uuid();
    this.app = App;
    this.name = name;
    this.options = options;
    if (this.options.single) this.options.allowParty = false;
    if (this.options.allowParty) this.party = Party;
    this.init();
  }

  say = (action, payload, extras = {}) => {
    this.app.say(this.key, {
      state: this.namespace,
      action,
      ...this.data,
      payload,
      ...extras,
    });
    return this;
  };

  update = () => {
    if (!this.options.lobby || this.party) return this;
    this.app.say(this.options.lobby, {
      state: this.namespace,
      action: "update",
      ...this.data,
    });
    return this;
  };

  join = (User) => {
    if (this.state != this.states.open || this.full) return false;
    if (this.party && User.party?.id != this.party.id) return false;
    if (!this.#addUser(User)) return false;

    if (this.options.announce) this.say("join", User.data);
    this.update();

    return true;
  };

  leave = (User) => {
    if (!this.#removeUser(User)) return false;

    if (this.options.announce) this.say("leave", User.data);
    this.update();

    return true;
  };

  remove = () => {
    db.del(this.dbKey);
    return this;
  };

  open = () => this.setState(this.states.open);
  close = () => this.setState(this.states.closed);
  busy = () => this.setState(this.states.busy);

  #addUser = (User) => {
    if (this.users[user.id]) return false;
    User.sub(this.key);
    this.users[User.id] = User;
    this.usersCount++;
    if (this.options.maxUsers && this.usersCount >= this.options.maxUsers)
      this.setFull(true);
    return true;
  };

  #removeUser = (User) => {
    if (!this.users[user.id]) return false;
    User.unsub(this.key);
    delete this.users[User.id];
    this.usersCount--;
    if (this.options.maxUsers && this.usersCount < this.options.maxUsers)
      this.setFull(false);
    return true;
  };

  init = () => {
    this.setKey();
    this.setState(this.states.open, false, false);

    db.hmset(this.dbKey, {
      key: this.key,
      id: this.id,
      name: this.name,
      party: this.party?.id,
      state: this.state,
      full: this.full,
      options: this.options,
      created_at: unix.now(),
    });

    return this;
  };

  setKey = () => {
    let key = [this.namespace, this.name];
    if (!this.options.single) key.push(this.id);

    if (this.party) {
      key.push("party");
      key.push(this.party.id);
    }

    this.key = keyer(key);

    return this;
  };

  setState = (state = null, full = null, update = true) => {
    if (state == this.states.close && !this.options.canClose) return this;
    let newKey = [this.key];
    if (state) this.state = state;
    if (full !== null) this.full = full;

    newKey.push("state");
    newKey.push(this.state);
    if (this.full) newKey.push("full");

    newKey = keyer(newKey);
    db.rename(this.dbKey, newKey);
    this.dbKey = newKey;

    if (update) this.update();
    return this;
  };

  setFull = (isFull) => {
    return this.setState(null, isFull);
  };
}

export default Room;
