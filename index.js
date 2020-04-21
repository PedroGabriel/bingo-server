console.log("-".repeat(50) + "\n".repeat(8));
require("dotenv").config();
const Client = require("./tests/client");

// {
//   key_file_name: "misc/key.pem",
//     cert_file_name: "misc/cert.pem",
//     passphrase: "1234",
// }

const App = require("./src/App");
const Server = new App(process.env.PORT_BINGO || 5000);
Server.testers = [
  "673c6d1a-7e0a-11ea-916c-fcaa14fc2b9b",
  "673c709e-7e0a-11ea-916c-fcaa14fc2b9b",
  "673c73ea-7e0a-11ea-916c-fcaa14fc2b9b",
  "673c7787-7e0a-11ea-916c-fcaa14fc2b9b",
  "673c7b6f-7e0a-11ea-916c-fcaa14fc2b9b",
];
const data = {};

const message = (id, msg) => {
  data[id] = msg;
  console.log(id, "R", msg);
};

const players = {
  1: {
    connect: (id, ws) => {
      if (!ws.connected) return;
    },
    message: (id, msg) => {},
  },
  2: {
    connect: (id, ws) => {
      if (!ws.connected) return;
    },
    message: (id, msg) => {},
  },
};

let delay = 2000;
Object.keys(players).forEach((key) => {
  setTimeout(() => {
    new Client(key, players[key], message);
  }, key * delay);
});
