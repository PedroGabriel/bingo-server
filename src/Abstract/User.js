import { db, keyer, getDiff } from "@/Libs";

class AbstractUser {
  namespace = "user";
  app;
  ws;

  id; // uuid
  key; // redis/pub/sub key
  storeKey; // redis/pub/sub user data key
  name; // user name

  room; // the current user this user is
  group; // group this user belongs to

  store = {};
  lastStore = {};

  get data() {
    return {
      [this.namespace]: {
        id: this.id,
        name: this.name,
      },
    };
  }

  update = () => {
    const data = { ...getDiff(this.lastStore, this.store) };
    if (Object.keys(data).length === 0) return this;
    try {
      this.do({
        state: this.namespace,
        action: "update",
        payload: data,
      });
    } catch (_) {}
    this.lastStore = { ...this.store };
    return this;
  };

  constructor(App, ws) {
    this.app = App;
    this.ws = ws;

    this.id = ws.id;
    this.name = ws.name;
    this.key = keyer(this.namespace, this.id);
    this.storeKey = keyer("store", this.namespace, this.id);
    this.app.users[this.id] = this;
  }

  go = (room) => this.app.go(room, this);
  goId = (id) => this.app.goId(id, this);
  goLobby = () => this.app.goLobby(this);
  goCreate = (name) => this.app.goCreate(name, this);
  goMatch = (name) => this.app.goMatch(name, this);

  remove = (User) => {
    User = User ?? this.app.users[this.id];
    if (User.group) User.group.leave(User);
    if (User.room) User.room.leave(User);
    delete this.app.users?.[User.id];
    return true;
  };
  static remove = this.remove;

  do = (payload) => {
    this.ws.do(payload);
    return this;
  };
  say = (key, state, action, payload, extras = {}) => {
    this.ws.toAll(key, {
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

  init = () => {
    return new Promise((resolve, reject) => {
      db.find(this.key).then((res) => {
        if (!res) {
          db.store(
            this.key,
            {
              key: this.key,
              id: this.id,
              name: this.name,
            },
            (error) => (error ? console.log(error) : null)
          );
        }

        db.find(this.storeKey).then((res) => {
          const initial_store = { ...this.store };
          let store = {};
          if (res) {
            store = res;
            Object.keys(store).forEach((k) => {
              let is_object = false;
              try {
                is_object = JSON.parse(store[k]);
              } catch (e) {}
              if (is_object) store[k] = is_object;
            });
          }
          this.store = new Proxy(store, {
            get: (target, prop) => Reflect.get(target, prop),
            set: (target, prop, value) => {
              let set = Reflect.set(target, prop, value);
              db.store(
                this.storeKey,
                prop,
                typeof value === typeof object ? JSON.stringify(value) : value
              );
              if (this.storeForce) {
                this.storeForce = false;
                this.update();
                return set;
              }
              clearTimeout(this.storeInterval);
              this.storeInterval = setTimeout(() => {
                this.update();
              }, 1000);
              return set;
            },
          });
          Object.keys(initial_store).forEach((k) => {
            if (!res || !store[k]) {
              this.store[k] = initial_store[k];
            }
          });
          this.update();
          return resolve(this);
        });
      });
    });
  };
}

export default AbstractUser;
