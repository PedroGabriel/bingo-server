import AbstractRoom from "@/Abstract/Room";
import { unix } from "@/Libs";
import ballGenerator from "@/Utils/ballGenerator";
import Card from "@/Utils/Card";

// JSON.stringify(a1.sort())==JSON.stringify(a2.sort())

const name = __filename.slice(__dirname.length + 1, -3);
const options = {
  lobby: "lobby",
  joinFrom: ["lobby"],
  announce: false,
};

class Room extends AbstractRoom {
  warming_time = 10; // seconds
  ending_time = 5; // seconds
  min_users = 2; // min users to start the match
  fee = 100; // the entrance fee for this room
  ball_interval = 1; // seconds

  constructor(App, User = null) {
    super(App, name, User, options);
  }

  onCreate = () => {
    this.logger("created");
    this.current_step = "waiting";
    this.game_steps[this.current_step]();
  };

  calcPlayers = () => {
    let changed = false;
    if (!["waiting", "warming"].includes(this.current_step)) return;
    this.maxWins = Math.round(this.usersCount * 0.235) || 1;
    if (this.maxWins != this.maxWinsPrevious) {
      this.maxWinsPrevious = this.maxWins;
      changed = true;
    }

    if (this.usersCount != this.usersCountPrevious) changed = true;
    if (changed)
      this.do("stats", { maxWins: this.maxWins, usersCount: this.usersCount });
  };

  game_steps = {
    waiting: () => {
      this.logger("waiting for players");
      this.current_step = "waiting";
      this.players = {}; // players in the match
      this.playersCount = 0; // players count in the match
      this.start_at = null; // when this match start (unix)
      this.balls = []; // the balls used in this match
      this.winners = {}; // the winners of the match
      this.do(this.current_step);
      // this.setOpen();

      this.forEachUser((User) => {
        if (!this.canJoin(User, true)) {
          this.logger(User.name, "kicked, out of coins");
          User.goLobby();
        }
      });

      this.calcPlayers();
    },

    warming: () => {
      this.logger("warming up for", this.warming_time);
      this.current_step = "warming";
      this.start_at = unix.add(this.warming_time);
      this.do(this.current_step, { start_at: this.start_at });
    },

    started: () => {
      this.current_step = "started";
      // this.setBusy();
      this.do(this.current_step);

      let users_key = Object.keys(this.users);
      this.players = users_key.reduce(
        (a, b) => (
          (a[b] = {
            Card: new Card(),
            winner: false,
            frozen: false,
            frozen_times: 0,
            last_try: [],
          }),
          a
        ),
        {}
      );
      this.playersCount = Object.keys(this.players).length;

      this.logger(
        "started,",
        this.maxWins,
        "wins and",
        this.playersCount,
        "players"
      );

      for (let k in this.players) {
        if (!this.users[k]) {
          delete this.players[k];
          continue;
        }
        this.users[k].store.coins -= this.fee;

        this.users[k].do({
          action: "card",
          payload: {
            card: this.players[k].Card.card,
          },
        });
      }

      this.ball_interval_var = setInterval(() => {
        let ball = ballGenerator(this.balls);
        this.balls.push(ball);
        this.do("ball", { number: ball });
        this.logger("sending ball", ball);
      }, this.ball_interval * 1000);
    },

    ending: (abort = false) => {
      clearInterval(this.ball_interval_var);
      this.current_step = "ending";
      this.do(this.current_step);

      if (abort) {
        this.logger("all players left, match aborted");
        this.game_steps.waiting();
        return;
      }

      this.logger("match ended, waiting", this.ending_time);
      let winners = { ...this.winners };
      let losers = { ...this.players };
      let balls = [...this.balls];

      for (let k in losers) {
        if (winners[k]) continue;
        if (!this.users[k]) continue;

        let could_win = losers[k].Card.checkWin(balls, true);
        if (could_win.length) {
          this.users[k].do({
            action: "unmarked",
            payload: { number: could_win },
          });
        }
      }
      setTimeout(() => {
        this.game_steps.waiting();
      }, this.ending_time * 1000);
    },
  };

  onUpdate = () => {
    if (this.current_step === "waiting") {
      if (this.usersCount >= this.min_users) this.game_steps.warming();
    }

    if (this.current_step === "warming") {
      if (this.start_at && unix.now() >= this.start_at) {
        this.game_steps.started();
      }
    }

    if (this.current_step === "started") {
      if (Object.keys(this.winners).length >= this.maxWins)
        this.game_steps.ending();
      if (this.balls.length >= 75) this.game_steps.ending();
    }
  };

  onMessage = (User, action, payload) => {
    // this.logger(User.name, "said", action, payload);

    if (action == "bingo" && payload.card) {
      if (this.current_step != "started") {
        this.logger(User.name, "no match is going.");
        return;
      }

      let player = this.players?.[User.id];
      if (!player || player.frozen || this.winners[User.id]) {
        if (!player) this.logger(User.name, "not found in match");
        if (player?.frozen) this.logger(User.name, "is frozen, ignored.");
        if (this.winners[User.id])
          this.logger(User.name, " you already won, ignored.");
        return;
      }

      if (Object.keys(this.winners).length >= this.maxWins) {
        this.logger(User.name, "max winners reachead");
        return;
      }

      let win = player.Card.checkWin(payload.card);
      if (!win.length) {
        player.frozen_times++;
        player.frozen = true;
        let time = player.frozen_times * this.ball_interval;
        this.logger(User.name, "bad bingo, get frozen");

        User.do({
          action: "freeze",
          payload: {
            until: unix.add(time),
            time,
          },
        });
        setTimeout(() => {
          player.frozen = false;
          this.logger(User.name, "unfroze");
        }, player.frozen_times * this.ball_interval * 1000);
        return;
      }

      this.winners[User.id] = 1;
      let rank = Object.keys(this.winners).length;
      let prize = this.fee + Math.round(this.playersCount / rank);
      this.do("winner", {
        name: User.name,
        rank,
      });
      User.do({
        action: "won",
        payload: {
          prize,
          rank,
        },
      });
      User.store.coins += prize;
      this.logger(User.name, "won at rank", rank, "prize", prize);
    }
  };

  canJoin = (User, called = false) => {
    let can = User.store.coins >= this.fee;
    if (!can && !called)
      this.logger(
        User.name,
        "can't pay",
        this.fee,
        "to join, just have",
        User.store.coins
      );
    return can;
  };

  onJoin = (User) => {
    this.logger(User.name, "joined the room");

    this.calcPlayers();
    if (!["waiting", "warming"].includes(this.current_step)) {
      User.do({ action: "waiting" });
      return;
    }
    User.do({ action: this.current_step });
  };

  onLeave = (User) => {
    this.logger(User.name, "left the room");
    this.calcPlayers();
    if (this.players[User.id]) {
      delete this.players[User.id];
      if (Object.keys(this.players).length <= 0) this.game_steps.ending(true);
    }
  };
}

export default Room;
