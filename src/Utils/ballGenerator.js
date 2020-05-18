export default (used = []) => {
  const min = 1;
  const max = 75;

  let num = 0;
  do {
    num = Math.floor(Math.random() * (max - min + 1)) + min;
  } while (used.includes(num));

  return num;
};
