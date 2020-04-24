import { uuid, keyer } from "@/Libs";

class AbstractParty {
  namespace = "party";
  app;

  id; // uuid
  key; // redis/pub/sub key

  leader; // id of this party leader
  users = {}; // all users inside this party

  get data() {
    return {
      [this.namespace]: {
        id: this.id,
        leader: this.leader?.id,
        // name: this.name ?? "",
      },
    };
  }

  constructor(App, User) {
    this.app = App;

    this.id = uuid();
    this.key = keyer(this.namespace, this.id);
    this.app.party[this.id] = this;
    this.leader = User;
    this.join(User);
  }

  isEmpty = () => Object.keys(this.users).length === 0;
  isMember = (User) => this.id === User.party?.id;

  chat = (User, payload) => {
    if (!this.isMember(User)) return false;
    if (!payload.message) return false;
    this.say("chat", { ...User.data, message: payload.message });
    return this;
  };

  getRandomUser = () => {
    if (this.isEmpty()) return false;
    let keys = Object.keys(this.users);
    return this.users[keys[(keys.length * Math.random()) << 0]];
  };
  setLeader = (User) => {
    this.leader = User;
    this.say("leader", User.data);
    return this;
  };
  getLeader = () => this.leader ?? null;
  isLeader = (User) => User.id === this.leader?.id;
  newLeader = (User = null, payload = {}) => {
    if (!this.isMember(User)) return this;
    if (!payload?.user.id || !this.isLeader(User)) return this;
    this.setLeader(this.app.users[payload.user.id]);
    return this;
  };
  newRandomLeader = () => {
    let User = this.getRandomUser();
    if (!User) return false;
    this.setLeader(User);
    return this;
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
    if (!this.isMember(User)) return this;
    delete this.users[User.id];
    this.say("leave", User.data);
    User.unsub(this.key);
    User.party = null;
    if (this.isLeader(User)) this.newRandomLeader();
    if (this.isEmpty()) this.remove();
    return this;
  };

  remove = (Party = null) => {
    Party = Party ?? this.app.party?.[this.id];
    delete this.app.party?.[Party.id];
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

export default AbstractParty;
