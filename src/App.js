const { uuid, md5, mysql, cookie, db, encoder } = require("./Libs");
const Ws = require("./Ws");
const User = require("./User");
const Party = require("./Party");
const Channel = require("./Channel");

// const channels = require("./Channels");

class App extends Ws {
  users = {};
  party = {};
  channels = {};
  rooms = {};

  constructor(port, ssl) {
    super();
    this.init(port, ssl, this.on);
  }

  on = {
    open: (ws) => {
      new User(this, ws).sub("announce");
    },
    message: (ws, msg) => {
      console.log("FROM", ws.id, msg);
      if (!msg.state || !msg.action) return;
      msg.state = msg.state.toLowerCase();
      msg.action = msg.action.toLowerCase();

      let user = this.users[ws.id] ? this.users[ws.id] : null;
      let args = {
        App: this,
        User: user,
        payload: msg.payload ? msg.payload : {},
      };

      if (msg.state == "party") {
        let id = msg.id ? msg.id : null;
        let party = null;
        if (msg.action == "create" && !id) new Party(args);
        if (id && this.party[id]) party = this.party[id];
        if (user && user.party) party = user.party;

        if (party && party.actions[msg.action]) party.actions[msg.action](args);
      }
      // nice

      if (msg.state == "channel") {
        let id = msg.id ? msg.id : null;
        let channel = null;
        if (id && this.channels[id]) channel = this.channels[id];
        if (user && user.channels[id]) channel = user.channels[id];

        if (channel && channel.actions[msg.action])
          channel.actions[msg.action](args);
      }

      if (msg.state == "user" && User.actions[msg.action])
        User.actions[msg.action](args);
    },
    close: (ws) => {
      let user = this.users[ws.id] ? this.users[ws.id] : null;
      if (user) user.remove();
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

module.exports = App;
