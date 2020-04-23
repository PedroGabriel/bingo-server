import mysql from "mysql";

const server = {
  host: "localhost",
  user: "root",
  password: "123456",
  database: "bingo",
  port: 3305,
};
export default mysql.createConnection(server);
