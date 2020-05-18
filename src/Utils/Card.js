class Card {
  card;
  #transposed;

  constructor(card = null) {
    this.card = card ?? this.#generate();
    this.#transposed = this.#transpose();
  }

  checkWin = (marked = [], ignore_fakes = false) => {
    let fake_ball = false;
    const marked_indexes = [];
    for (let i of marked) {
      let index = this.#transposed.indexOf(i);
      if (index < 0) {
        if (!ignore_fakes) {
          fake_ball = true;
          break;
        }
        continue;
      }
      marked_indexes.push(index);
    }
    if (!ignore_fakes && fake_ball) return [];

    let square = 0;
    for (let i of marked_indexes) square = square | Math.pow(2, i);

    let winningOption = -1;
    for (let i = 0; i < this.#winners.length; i++) {
      if ((this.#winners[i] & square) == this.#winners[i]) winningOption = i;
    }

    const winning_numbers = [];
    if (winningOption > -1) {
      for (let i = 0; i < 25; i++) {
        if (this.#winners[winningOption] & Math.pow(2, i))
          winning_numbers.push(this.#transposed[i]);
      }
    }
    if (winning_numbers.length) return winning_numbers;
    return [];
  };

  #generate = (gap_per_col = 15) => {
    const rows = "0,1,2,3,4,0,1,2,3,4,0,1,2,3,4,0,1,2,3,4,0,1,2,3,4".split(",");
    let used = {};
    let result = [];
    for (let i = 0; i < 25; i++) {
      rows[i] = parseInt(rows[i]);

      let num = 0;
      do {
        num =
          rows[i] * gap_per_col + Math.floor(Math.random() * gap_per_col) + 1;
      } while (used[num]);
      used[num] = 1;
      result.push(num);
    }
    return result;
  };

  #transpose = () => {
    let card = this.#chunkArray(this.card);

    card = Object.keys(card[0]).map((c) => {
      return card.map((r) => {
        return r[c];
      });
    });

    return this.#unChunkArray(card);
  };

  #chunkArray = (myArray = []) => {
    var index = 0;
    var arrayLength = myArray.length;
    var tempArray = [];
    var myChunk;
    for (index = 0; index < arrayLength; index += 5) {
      myChunk = myArray.slice(index, index + 5);
      tempArray.push(myChunk);
    }

    return tempArray;
  };

  #unChunkArray = (myArray) => {
    var index = 0;
    var tempArray = [];
    for (index of myArray) tempArray = [...tempArray, ...index];

    return tempArray;
  };

  #winners = [
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

  /*
    pattern = [
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
}

export default Card;
