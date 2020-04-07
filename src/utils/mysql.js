let mysql = require("mysql");

const server = {
  host: "localhost",
  user: "root",
  password: "123456",
  database: "bingo",
};
module.exports = mysql.createConnection(server);
