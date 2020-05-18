import Ws from "@/Ws";
import User from "@/User";
import Group from "@/Group";
import Rooms from "@/Rooms";

class App extends Ws {
  users = {};
  groups = {};
  rooms = {};
  lobby;

  constructor(port, ssl) {
    super();
    this.init(port, ssl, this.on);

    this.lobby = new Rooms["lobby"](this);
    ["mode-50-coins"].forEach((k) => {
      if (Rooms[k]) new Rooms[k](this);
    });
  }

  on = {
    open: (ws) => {
      new User(this, ws).init().then((user) => {
        user.sub("announce");
        try {
          user.go(this.lobby);
        } catch (error) {
          console.log(error);
        }
      });
    },
    message: (ws, msg) => {
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

      if (user.room && msg.state == "room") {
        user.room?.message?.(user, msg?.action, msg?.payload);
      }

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

  goCreate = (name, User) => {
    const RoomClass = Rooms[name];
    if (!RoomClass) return false;

    if (RoomClass.options?.autoCreate) {
      if (RoomClass.options?.ownable) return new RoomClass(this, User);
      return new RoomClass(this).join(User);
    }
    return false;
  };
  goMatch = (name, User) => {
    const RoomClass = Rooms[name];
    if (!RoomClass) return false;

    let joined;
    const rooms = this.getLobbyRooms();
    for (let i in rooms) {
      room = this.rooms[i];
      if (RoomClass.name !== room.name) continue;
      joined = room.join(User);
      if (joined) break;
    }
    return joined;
  };
  goId = (id, User) => {
    if (!this.rooms[id]) return false;
    return this.rooms[id].join(User);
  };
  goLobby = (User) => {
    return this.lobby.join(User);
  };
  go = (Room, User) => {
    return Room.join(User);
  };

  getLobbyRooms = () => {
    const rooms = [];
    for (let i in this.rooms) {
      let room = this.rooms[i] ?? false;
      if (!room || !room.options?.lobby) continue;
      rooms.push({ ...room.data });
    }
    return rooms;
  };
}

export default App;
