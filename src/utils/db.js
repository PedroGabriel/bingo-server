const redis = require("redis");
const redisScan = require("node-redis-scan");

const client = redis.createClient();
const scanner = new redisScan(client);

client.scanner = scanner;

client.on("connect", () => {});
client.on("error", err => console.log("REDIS ERROR " + err));

module.exports = client;
