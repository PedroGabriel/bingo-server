import { uuid, keyer, getDiff } from "@/Libs";
// import { db, unix } from "@/Libs";

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
    announce: true, // pub to room when new player join or leave
    lobby: "", // pub to this sub room main data changes
    maxUsers: 0, // Max users in this room
    canClose: false, // if this room can be set to closed to prevent users join
    joinFrom: null, // from wich rooms this room can be joined (array of names)
  };
  options;

  onUpdateInterval;
  // storeInterval;
  // storeForce = false;
  // children things
  // store = new Proxy(
  //   {},
  //   {
  //     get: (target, prop) => Reflect.get(target, prop),
  //     set: (target, prop, value) => {
  //       let set = Reflect.set(target, prop, value);
  //       if (this.storeForce) {
  //         this.storeForce = false;
  //         this.update();
  //         return set;
  //       }
  //       console.log(prop, value);
  //       clearTimeout(this.storeInterval);
  //       this.storeInterval = setTimeout(() => {
  //         this.update();
  //       }, 1000);
  //       return set;
  //     },
  //   }
  // );
  onCreate; // when room is created
  onUpdate; // room loop
  canJoin; // check if the user can join this room
  onJoin; // when user join
  onMessage; // when room get messaged
  onLeave; // when user leave

  get data() {
    return {
      id: this.id,
      name: this.name,
      maxUsers: this.maxUsers ?? 0,
      usersCount: this.usersCount ?? 0,
      state: this.state ?? this.states.open,
      full: this.full ?? false,
    };
  }

  constructor(App, name, User = null, options = {}) {
    this.options = { ...Room.options, ...options };
    if (this.options.single) {
      this.options.ownable = false;
      this.options.autoCreate = false;
    }

    this.id = uuid();
    this.app = App;
    this.name = name;

    if (User && this.options.ownable && User.group) this.group = User.group;
    if (this.ownable) this.owner = User;

    this.app.rooms[this.id] = this;

    this.init();
    if (User) this.join(User);
  }

  say = (action, payload, extras = {}) => {
    this.app.say(this.key, {
      state: this.namespace,
      action,
      // [this.namespace]: {
      //   id: this.id,
      //   name: this.name,
      // },
      payload,
      ...extras,
    });
    return this;
  };

  do = (action, payload, step = "") => {
    this.app.say(this.key + (step ? `-${step}` : ""), {
      action,
      // [this.namespace]: {
      //   id: this.id,
      //   name: this.name,
      // },
      payload,
    });
    return this;
  };

  // lobby/group updates
  lastUpdate = {};
  update = () => {
    if (!this.options?.lobby || this.group) return this;

    const data = { ...this.data };
    const diff = getDiff(this.lastUpdate, data);
    this.lastUpdate = data;
    diff.id = data.id;
    // diff.name = data.name;

    this.app.say(this.options.lobby, {
      state: this.namespace,
      action: "update",
      payload: diff,
    });

    return this;
  };

  message = (User, action = "", payload = {}) => {
    this.onMessage?.(User, action, payload);
    return this;
  };

  join = (User) => {
    if (User.room?.id === this.id) return false;
    if (this.state != this.states.open || this.full) return false;
    if (this.group && !this.group.isMember(User)) return false;
    if (Array.isArray(this.options?.joinFrom)) {
      if (!this.options.joinFrom.includes(User.room?.name ?? "")) return false;
    }
    if (this?.canJoin && this.canJoin?.(User) === false) return false;

    if (User.room) User.room.leave(User);

    this.users[User.id] = User;
    User.room = this;
    this.usersCount++;
    if (this.options.maxUsers && this.usersCount >= this.options.maxUsers)
      this.setFull(true, false);

    if (this.options.announce) this.say("join", User.data);

    process.nextTick(() => {
      const data = {
        state: User.namespace,
        action: "join",
        payload: { ...this.data },
      };
      // if (Object.keys(this.store).length !== 0) data.store = { ...this.store };
      User.do(data);
      setImmediate(() => {
        User.sub(this.key);
        this.onJoin?.(User);
        this.update();
      });
    });
    return this;
  };

  leave = (User) => {
    if (User.room?.id !== this.id) return false;
    try {
      User.unsub(this.key);
    } catch (error) {}
    delete this.users?.[User.id];
    User.room = null;
    this.usersCount--;
    if (this.options.maxUsers && this.usersCount < this.options.maxUsers)
      this.setFull(false, false);

    if (this.options.announce) this.say("leave", User.data);
    if (this.isOwner(User)) this.newRandomOwner();
    this.update();
    try {
      this.onLeave?.(User);
    } catch (error) {}
    return true;
  };

  remove = () => {
    // db.del(this.dbKey);
    if (this.onUpdateInterval) clearInterval(this.onUpdateInterval);
    return this;
  };

  setOpen = () => this.setState(this.states.open);
  setClose = () => this.setState(this.states.closed);
  setBusy = () => this.setState(this.states.busy);

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
  forEachUser = (callback = () => {}) => {
    Object.keys(this.users).forEach((key) => {
      callback(this.users[key]);
    });
  };

  init = () => {
    this.setKey();
    this.setState(this.states.open, false, false);
    // db.store(
    //   this.dbKey,
    //   {
    //     key: this.key,
    //     id: this.id,
    //     name: this.name,
    //     group: this.group?.id ?? false,
    //     state: this.state,
    //     full: this.full,
    //     options: JSON.stringify(this.options),
    //     created_at: unix.now(),
    //   },
    //   (error, res) => {
    //     if (error) console.log(error);
    //   }
    // );

    process.nextTick(() => {
      this.onCreate?.();
      setImmediate(() => {
        if (this.onUpdate) this.onUpdateInterval = setInterval(this.onUpdate);
      });
    });
    return this;
  };

  setKey = () => {
    let key = [this.namespace, this.name];
    key.push(this.id);

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
    // if (this.dbKey) {
    //   db.rename(this.dbKey, newKey, (error) => {
    //     if (error) console.log(error);
    //   });
    // }
    // this.dbKey = newKey;

    if (update) this.update();
    return this;
  };

  setFull = (isFull, update = true) => {
    return this.setState(null, isFull, update);
  };

  logger = function () {
    console.log(`room ${this.name}:`, ...arguments);
  };
}

export default Room;
