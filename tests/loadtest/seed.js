require("dotenv").config();

const db = require("./src/utils/db");
const mysql = require("./src/utils/mysql");
let keys = 0;

mysql.query(
  `SELECT session_id, uuid, name FROM users WHERE uid > 6`,
  (error, result) => {
    result.forEach((res) => {
      let user = {
        id: res.uuid,
        name: res.name,
      };
      db.hmset(`session:${res.session_id}`, user);
      keys++;
      console.log("SAVED " + keys);
    });
  }
);
