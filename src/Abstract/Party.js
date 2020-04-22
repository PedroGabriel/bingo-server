const { uuid, keyer } = require("../Libs");

class AbstractParty {
  app = null;
  namespace = "party";

  id = null; // uuid
  key = ""; // redis/pub/sub key

  leader = null; // id of this party leader
  users = {}; // all users inside this party

  get data() {
    return {
      party: {
        id: this.id,
        // name: this.name ? this.name : "",
      },
    };
  }

  constructor({ App, User }) {
    this.app = App;

    this.id = uuid();
    this.key = keyer(this.namespace, this.id);
    this.app.party[this.id] = this;
    this.leader = User;
    this.join(User);
  }

  setLeader = (User) => {
    if (!User) return false;
    this.leader = User;
    this.say("leader", User.data);
  };

  isEmpty = () => Object.keys(this.users).length === 0;

  chat = (User, payload) => {
    if (!payload.message) return false;
    this.say("chat", { ...User.data, message: payload.message });
    return this;
  };

  newLeader = (User = null, payload = {}) => {
    let newLeader = false;
    if (
      payload.user.id &&
      User.id == this.leader.id &&
      this.app.users[payload.user.id] &&
      this.app.users[payload.user.id].party.id == this.id
    ) {
      newLeader = this.app.users[payload.user.id];
    }
    if (!newLeader) return false;
    this.setLeader(newLeader);
  };

  newRandomLeader = () => {
    let User = this.getRandomUser();
    if (!User) return false;
    this.setLeader(User);
  };

  getRandomUser = () => {
    if (this.isEmpty()) return false;
    let keys = Object.keys(this.users);
    return this.users[keys[(keys.length * Math.random()) << 0]];
  };

  getLeader = () => {
    if (!this.leader) return false;
    return this.leader;
  };

  join = (User) => {
    if (User.party) User.party.leave(User);
    this.users[User.id] = User;
    User.party = this;
    User.sub(this.key);
    this.say("join", User.data);
    return this;
  };

  leave = (User) => {
    delete this.users[User.id];
    this.say("leave", User.data);
    User.unsub(this.key);
    if (User.id === this.leader.id) this.newRandomLeader();
    if (this.isEmpty()) this.remove();
    return this;
  };

  remove = (Party = null) => {
    Party = Party ? Party : this.app.party[this.id];
    delete this.app.party[this.id];
    return true;
  };

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
}

module.exports = AbstractParty;
