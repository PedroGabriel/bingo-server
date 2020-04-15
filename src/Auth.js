const { uuid, md5, mysql, cookie, db } = require("./Utils");

module.exports = {
  register: (res, name, email, password) => {
    return new Promise((resolve, reject) => {
      mysql.query(
        `SELECT * FROM users WHERE email = ? LIMIT 1`,
        [email],
        (error, emailUsed) => {
          if (error) return reject("Something went wrong");
          if (emailUsed.length) reject("Email address already in use");
          let sid = uuid();
          let id = uuid();
          mysql.query(
            `INSERT INTO users (uuid,name,email,password,session_id,type)VALUE(?,?,?,?,?,?)`,
            [id, name, email, md5(password), sid, "user"],
            (error) => {
              if (error) return reject("Something went wrong");

              let user = { id, name };
              cookie.set(res, "SID", sid);
              db.hmset(`session:${sid}`, user);
              resolve(user);
            }
          );
        }
      );
    });
  },
  login: (res, email, password) => {
    return new Promise((resolve, reject) => {
      mysql.query(
        `SELECT uid, uuid, name FROM users WHERE email = ? AND password = ? LIMIT 1`,
        [email, md5(password)],
        (error, result) => {
          if (error) return reject("Something went wrong");
          if (!result.length) return reject("Account not found");
          result = result[0];
          let sid = uuid();
          mysql.query(
            `UPDATE users SET session_id = ?, count_login = count_login + 1 WHERE uid = ?`,
            [sid, result.uid],
            (error) => {
              if (error) return reject("Something went wrong");

              let user = {
                id: result.uuid,
                name: result.name,
              };
              cookie.set(res, "SID", sid);
              db.hmset(`session:${sid}`, user);
              resolve(user);
            }
          );
        }
      );
    });
  },
  logout: (res) => {
    return new Promise((resolve) => {
      cookie.del(res, "SID");
      resolve();
    });
  },
  guest: (res) => {
    return new Promise((resolve, reject) => {
      let sid = uuid();
      let id = uuid();
      let name = guestNameGenerator();
      mysql.query(
        `INSERT INTO users (uuid,name,session_id,type)VALUE(?,?,?,?)`,
        [id, name, sid, "guest"],
        (error) => {
          if (error) return reject("Something went wrong");

          let user = { id, name };
          cookie.set(res, "SID", sid);
          db.hmset(`session:${sid}`, user);
          resolve(user);
        }
      );
    });
  },
};

const guestNameGenerator = () => {
  let syllables = [2, 3];
  syllables = syllables[Math.floor(Math.random() * 2)];
  let vowel = "aeiou".split("");
  let consonant = "bcdfghjklmnprstvwxyz".split("");

  let name = "";
  for (i = 1; i <= syllables; i++) {
    name += consonant[Math.floor(Math.random() * consonant.length)];
    name += vowel[Math.floor(Math.random() * vowel.length)];
  }

  return "Guest" + name.charAt(0).toUpperCase() + name.slice(1);
};
