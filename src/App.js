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
      let user = new User(this, ws).sub("announce");
      // Rooms["main"].join(user);
    },
    message: (ws, msg) => {
      console.log("FROM", ws.id, msg);
      if (!msg.state || !msg.action) return;
      msg.state = msg.state.toLowerCase();
      msg.action = msg.action.toLowerCase();

      let user = this.users?.[ws.id];
      let id = msg?.id;

      if (msg.state == "party") {
        let party = null;
        if (msg.action == "create" && !id) new Party(this, user);
        if (id && this.party[id]) party = this.party[id];
        if (user && user.party) party = user.party;

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
      let user = this.users?.[ws.id];
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
