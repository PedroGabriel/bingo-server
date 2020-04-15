const rows = "0,1,2,3,4,0,1,2,3,4,0,1,3,4,0,1,2,3,4,0,1,2,3,4".split(",");
const rule_text = [
  "B: 01 a 15",
  "I: 16 a 30",
  "N: 31 a 45",
  "G: 46 a 60",
  "O: 61 a 75",
];
const rule = [
  { min: 1, max: 15 },
  { min: 16, max: 30 },
  { min: 31, max: 45 },
  { min: 46, max: 60 },
  { min: 61, max: 75 },
];
let all_test = true;

module.exports = (gap_per_col = 15) => {
  for (test = 1; test <= 1; test++) {
    let used = {};
    let test_passed = true;
    for (var i = 0; i < 24; i++) {
      rows[i] = parseInt(rows[i]);

      let num = 0;
      do {
        num =
          rows[i] * gap_per_col + Math.floor(Math.random() * gap_per_col) + 1;
      } while (used[num]);
      used[num] = 1;
      // log.dev(num, rule_text[rows[i]]);
      if (num < rule[rows[i]].min || num > rule[rows[i]].max)
        test_passed = false;
    }
    // log.dev(test_passed ? "OK" : "FAILED");
    // log.dev("\n");
    if (!test_passed) all_test = false;
  }
};
// log.dev(all_test ? "ALL OK" : "SOME FAILED");
