console.log("\n\n\n\n\n\n\n\n\n\n\n\n\n\n");
console.log("\n\n\n\n\n\n\n\n\n\n\n\n\n\n");
console.clear();
console.clear();

import Client from "./tests/client";
import Card from "./src/Utils/Card";

const userData = {};

const globalMessagesReceived = (id, msg) => {
  // userData[id] = msg;
  // console.log(id, "R", msg);
};

const clientConnect = (id, ws) => {
  if (!ws.connected) return;
  userData[id] = {};
  // ws.send(
  //   JSON.stringify({
  //     state: "room",
  //     action: "jump",
  //     payload: { time: 123456789 },
  //   })
  // );
};

const clientMessage = (id, msg, ws) => {
  if (msg.action == "lobby") {
    ws.send(
      JSON.stringify({
        state: "room",
        action: "join",
        payload: { id: msg.payload[0].id },
      })
    );
  }
  if (msg.action == "warming") {
    console.log(id, "IM WARMING");
  }
  if (msg.action == "started") {
    console.log(id, "IM PLAYING");
  }
  if (msg.action == "card") {
    userData[id].Card = new Card(msg.payload.card);
    userData[id].balls = [];
    userData[id].myBalls = [];
  }
  if (msg.action == "ball" && userData[id].Card) {
    userData[id].balls.push(msg.payload.number);
    if (userData[id].Card.card.includes(msg.payload.number)) {
      userData[id].myBalls.push(msg.payload.number);

      // console.log(
      //   "tenho",
      //   userData[id].myBalls.length,
      //   "de",
      //   userData[id].balls.length,
      //   userData[id].myBalls
      // );
    }

    // ws.send(
    //   JSON.stringify({
    //     state: "room",
    //     action: "bingo",
    //     payload: { card: [1, 2, 3, 4, 5, 6, 7, 8] },
    //   })
    // );

    if (
      !userData[id].won &&
      userData[id].Card.checkWin(userData[id].myBalls).length
    ) {
      ws.send(
        JSON.stringify({
          state: "room",
          action: "bingo",
          payload: {
            card: userData[id].Card.checkWin(userData[id].myBalls),
          },
        })
      );
      userData[id].won = true;
      console.log(
        id,
        "bingo com as bolas",
        userData[id].Card.checkWin(userData[id].myBalls)
      );
    }
  }
};

const players = {};
for (let i = 1; i <= 1000; i++) {
  players[i] = {
    connect: clientConnect,
    message: clientMessage,
  };
}

let delay = 1;
Object.keys(players).forEach((key) => {
  setTimeout(() => {
    new Client(key, players[key], globalMessagesReceived);
  }, key * delay);
});
