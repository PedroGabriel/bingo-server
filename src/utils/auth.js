const uuid = require("../utils/uuid.js");
const md5 = require("../utils/md5.js");
const mysql = require("../utils/mysql.js");
const cookie = require("../utils/cookie.js");
const db = require("../utils/db.js");

module.exports = {
  login: (res, email, password) => {
    return new Promise((resolve, reject) => {
      mysql.query(
        `SELECT * FROM users WHERE email = ? AND password = ? LIMIT 1`,
        [email, md5(password)],
        (error, user) => {
          if (error) {
            return reject();
          }
          user = user[0];
          let session_id = uuid();
          mysql.query(
            `UPDATE users SET session_id = ?, count_login = count_login + 1 WHERE uid = ? AND type = ?`,
            [session_id, user.uid, "user"],
            (error) => {
              if (error) return reject();
              user.session_id = session_id;
              user.count_login = user.count_login + 1;
              cookie.set(res, "sessionid", session_id);
              resolve(user);
            }
          );
        }
      );
    });
  },
  logout: (res) => {},
};
