// const rule_text = [
//   "B: 01 a 15",
//   "I: 16 a 30",
//   "N: 31 a 45",
//   "G: 46 a 60",
//   "O: 61 a 75",
// ];
export default (gap_per_col = 15) => {
  const rows = "0,1,2,3,4,0,1,2,3,4,0,1,2,3,4,0,1,2,3,4,0,1,2,3,4".split(",");
  let used = {};
  let result = [];
  for (let i = 0; i < 25; i++) {
    rows[i] = parseInt(rows[i]);

    let num = 0;
    do {
      num = rows[i] * gap_per_col + Math.floor(Math.random() * gap_per_col) + 1;
    } while (used[num]);
    used[num] = 1;
    // console.log(num, rule_text[rows[i]]);
    result.push(num);
  }
  return result;
};
