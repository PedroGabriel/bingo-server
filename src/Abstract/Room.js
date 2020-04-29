import { uuid, db, keyer, unix } from "@/Libs";

class Room {
  namespace = "room";
  id; // The unique id
  key; // The current db key name (without state)
  dbKey; // Current room key without state
  name; // The unique room name
  app; // ws server

  users = {}; // All users inside this room
  usersCount = 0; // Total users inside this room

  owner; // the user that own this room (can tweak settings)
  group; // If this is a group room, group object

  states = {
    open: "open",
    closed: "closed",
    busy: "busy",
  };
  state; // Current room state
  full; // kinda obvious

  static options = {
    single: true, // If only a single room (sub) of this should exists
    autoCreate: true, // if a new room should be created if noone is available
    ownable: false, // if a user can create this room, false when single
    announce: true, // pub to room when new player join
    lobby: "", // pub to this sub player count change or state change
    maxUsers: 0, // Max users in this room
    minUsers: 1, // Min players to start the room logic running
    canClose: false, // if this room can be set to closed to prevent users join
  };
  options;

  store = {}; // store given to the public about this room

  get data() {
    return {
      [this.namespace]: {
        id: this.id,
        name: this.name,
      },
    };
  }

  get updateData() {
    const data = {
      [this.namespace]: {
        id: this.id,
        maxUsers: this.maxUsers ?? 0,
        usersCount: this.usersCount ?? 0,
        state: this.state ?? this.states.open,
        full: this.full ?? false,
      },
    };
    if (Object.keys(this.store).length !== 0)
      data[this.namespace].store = { ...this.store };
    return data;
  }

  constructor(App, name, User = null, options = {}) {
    this.options = { ...Room.options, ...options };
    if (this.options.single) {
      this.options.ownable = false;
      this.options.autoCreate = false;
    }
    if (this.options.ownable && User.group) this.group = User.group;
    this.id = uuid();
    this.app = App;
    this.name = name;

    if (this.options?.single) {
      if (!this.app.rooms[this.name]) this.app.rooms[this.name] = this;
    } else {
      if (!this.app.rooms[this.name]) this.app.rooms[this.name] = {};
      this.app.rooms[this.name][this.id] = this;
    }

    if (this.ownable) this.owner = User;
    this.init().join?.(User);
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
    if (!this.options.lobby || this.group) return this;
    this.app.say(this.options.lobby, {
      state: this.namespace,
      action: "update",
      ...this.updateData,
    });
    return this;
  };

  join = (User) => {
    if (this.state != this.states.open || this.full) return false;
    if (this.group && !this.group.isMember(User)) return false;

    if (this.users[User.id]) return false;
    this.users[User.id] = User;
    User.room = this;
    this.usersCount++;
    if (this.options.maxUsers && this.usersCount >= this.options.maxUsers)
      this.setFull(true, false);

    if (this.options.announce) this.say("join", User.data);
    User.do({
      state: this.namespace,
      action: "join",
      ...this.data,
      ...this.updateData,
    });
    setTimeout(() => {
      User.sub(this.key);
      this.update();
    });
    return this;
  };

  leave = (User) => {
    if (!this.users[User.id]) return false;
    try {
      User.unsub(this.key);
    } catch (error) {}
    delete this.users[User.id];
    User.room = null;
    this.usersCount--;
    if (this.options.maxUsers && this.usersCount < this.options.maxUsers)
      this.setFull(false, false);

    if (this.options.announce) this.say("leave", User.data);
    if (this.isOwner(User)) this.newRandomOwner();
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

  isEmpty = () => Object.keys(this.users).length === 0;
  isMember = (User) => this.id === User.room?.id;

  getRandomUser = () => {
    if (this.isEmpty()) return false;
    let keys = Object.keys(this.users);
    return this.users[keys[(keys.length * Math.random()) << 0]];
  };
  setOwner = (User) => {
    this.owner = User;
    this.say("owner", User.data);
    return this;
  };
  getOwner = () => this.owner ?? null;
  isOwner = (User) => User.id === this.owner?.id;
  newOwner = (User = null, payload = {}) => {
    if (!this.isMember(User)) return this;
    if (!payload?.user.id || !this.isOwner(User)) return this;
    this.say("owner", User.data);
    this.setOwner(this.app.users[payload.user.id]);
    return this;
  };
  newRandomOwner = () => {
    let User = this.getRandomUser();
    if (!User) return false;
    this.setOwner(User);
    return this;
  };

  init = () => {
    this.setKey();
    this.setState(this.states.open, false, false);
    db.hmset(
      this.dbKey,
      {
        key: this.key,
        id: this.id,
        name: this.name,
        group: this.group?.id ?? false,
        state: this.state,
        full: this.full,
        options: JSON.stringify(this.options),
        created_at: unix.now(),
      },
      (error, res) => {
        if (error) console.log(error);
      }
    );

    return this;
  };

  setKey = () => {
    let key = [this.namespace, this.name];
    if (!this.options.single) key.push(this.id);

    if (this.group) {
      key.push("group");
      key.push(this.group.id);
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
    if (this.dbKey) {
      db.rename(this.dbKey, newKey, (error) => {
        if (error) console.log(error);
      });
    }
    this.dbKey = newKey;

    if (update) this.update();
    return this;
  };

  setFull = (isFull, update = true) => {
    return this.setState(null, isFull, update);
  };
}

export default Room;
