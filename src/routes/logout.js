module.exports = {
  name: "logout",
  path: "/logout",
  type: "get",
  page: (res, req) => {
    res.end("rest logout");
  },
};