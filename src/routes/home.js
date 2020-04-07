module.exports = {
  name: "home",
  path: "/",
  type: "get",
  page: (res, req) => {
    res.end("home");
  },
};
