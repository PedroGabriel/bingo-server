import Ws from "@/Ws";
import User from "@/User";
import Party from "@/Party";
import Rooms from "@/Rooms";

class App extends Ws {
  users = {};
  party = {};
  // channels = {};
  rooms = {};

  constructor(port, ssl) {
    super();
    this.init(port, ssl, this.on);
  }

  on = {
    open: (ws) => {
      const user = new User(this, ws).sub("announce");
      // Rooms["main"].join(me);
    },
    message: (ws, msg) => {
      console.log("FROM", ws.id, msg);
      if (!msg.state || !msg.action) return;
      msg.state = msg.state.toLowerCase();
      msg.action = msg.action.toLowerCase();

      const user = this.users?.[ws.id];
      const id = msg?.id;

      if (msg.state == "party") {
        let party = null;
        if (msg.action == "create" && !id) new Party(this, user);
        if (user && user.party) party = user.party;
        if (id && this.party[id]) party = this.party[id];

        if (party && party.actions[msg.action])
          party.actions[msg.action](user, msg?.payload);
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
}

export default App;
