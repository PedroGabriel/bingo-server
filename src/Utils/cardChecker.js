export default () => {
  /*
  00 05 10 15 20
  01 06 11 16 21
  02 07 12 17 22
  03 08 13 18 23
  04 09 14 19 24
  */

  /*
  let pattern = [
    [0, 1, 2, 3, 4], // |
    [5, 6, 7, 8, 9], // |
    [10, 11, 12, 13, 14], // |
    [15, 16, 17, 18, 19], // |
    [20, 21, 22, 23, 24], // |

    [0, 5, 10, 15, 20], // ─
    [1, 6, 11, 16, 21], // ─
    [2, 7, 12, 17, 22], // ─
    [3, 8, 13, 18, 23], // ─
    [4, 9, 14, 19, 24], // ─

    [0, 6, 12, 18, 24], // \
    [4, 8, 12, 16, 20], // /
  ];
  */

  const winners = [
    31, // |
    992, // |
    31744, // |
    1015808, // |
    32505856, // |
    1082401, // ─
    2164802, // ─
    4329604, // ─
    8659208, // ─
    17318416, // ─
    17043521, // \
    1118480, // /
  ];

  const original_card = [
    11,25,40,60,66,
    2, 26,38,46,65,
    4, 17,35,47,63,
    1, 18,37,53,74,
    6, 21,32,55,68,
  ];
  const card = transpose(original_card);

  const marked = [66,65,63,74,68];
  const marked_indexes = [];

  for (let i of marked) {
    let index = card.indexOf(i);
    if (index < 0) continue;
    marked_indexes.push(index);
  }

  let square = 0;
  for (let i of marked_indexes) square = square | Math.pow(2, i);

  let winningOption = -1;
  for (let i = 0; i < winners.length; i++) {
    if ((winners[i] & square) == winners[i]) {
      winningOption = i;
    }
  }

  const winning_numbers = [];
  if (winningOption > -1) {
    for (let i = 0; i < 25; i++) {
      if (winners[winningOption] & Math.pow(2, i))
        winning_numbers.push(card[i]);
    }
  }
  if (winning_numbers.length) console.log(winning_numbers);
  else console.log("FREEZE");
};
/*"B: 01 a 15",
"I: 16 a 30",
"N: 31 a 45",
"G: 46 a 60",
"O: 61 a 75",
*/

function chunkArray(myArray) {
  var index = 0;
  var arrayLength = myArray.length;
  var tempArray = [];
  var myChunk;
  for (index = 0; index < arrayLength; index += 5) {
    myChunk = myArray.slice(index, index + 5);
    tempArray.push(myChunk);
  }

  return tempArray;
}

function unChunkArray(myArray) {
  var index = 0;
  var tempArray = [];
  for (index of myArray) tempArray = [...tempArray, ...index];

  return tempArray;
}

function transpose(card) {
  card = chunkArray(card);

  card = Object.keys(card[0]).map(function (c) {
    return card.map(function (r) {
      return r[c];
    });
  });

  return unChunkArray(card);
}
