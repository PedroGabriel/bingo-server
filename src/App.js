import Ws from "@/Ws";
import User from "@/User";
import Group from "@/Group";
import Rooms from "@/Rooms";

class App extends Ws {
  users = {};
  groups = {};
  rooms = {};

  constructor(port, ssl) {
    super();
    this.init(port, ssl, this.on);
  }

  on = {
    open: (ws) => {
      const user = new User(this, ws).sub("announce");
      try {
        this.go("main", user);
      } catch (error) {
        console.log(error);
      }

      // Rooms["main"].join(user);
    },
    message: (ws, msg) => {
      console.log("FROM", ws.id, msg);
      if (!msg.state || !msg.action) return;
      msg.state = msg.state.toLowerCase();
      msg.action = msg.action.toLowerCase();

      const user = this.users?.[ws.id];
      const id = msg?.id;

      if (typeof Group !== "undefined" && msg.state == "group") {
        let group = null;
        if (msg.action == "create" && !id) new Group(this, user);
        if (user && user.group) group = user.group;
        if (id && this.groups[id]) group = this.groups[id];

        if (group && group.actions[msg.action])
          group.actions[msg.action](user, msg?.payload);
      }

      // if (msg.state == "channel") {
      //   let channel = null;
      //   if (id && this.channels[id]) channel = this.channels[id];
      //   if (user && user.channels[id]) channel = user.channels[id];

      //   if (channel && channel.actions[msg.action])
      //     channel.actions[msg.action](user, msg?.payload);
      // }

      if (msg.state == "user" && User.actions[msg.action])
        User.actions[msg.action](user, msg?.payload);
    },
    close: (ws) => {
      const user = this.users?.[ws.id];
      user?.remove();
    },
  };

  say = (key, payload) => {
    this.send(key, payload);
    return this;
  };
  announce = (payload) => {
    this.say("announce", payload);
    return this;
  };

  go = (name, User, key = "") => {
    const RoomClass = Rooms[name];
    if (!RoomClass) return false;

    let Room;
    if (key) Room = this.rooms?.[name]?.[key];
    if (!Room) Room = this.rooms?.[name];
    if (!Room) {
      if (RoomClass.options?.autoCreate) {
        return new RoomClass(this, User);
      }
      return false;
    }

    if (RoomClass.options?.single) {
      return Room.join(User);
    }
    if (Room?.full) {
      let joined;
      let keys = Object.keys(this.rooms[name]);
      for (let i = 0; i < keys.length; i++) {
        joined = this.rooms[name][keys[i]].join(User);
        if (joined) break;
      }
      return joined;
    }

    return Room.join(User);
  };
}

export default App;
