export const cloneIncrementName = (str: string, names: string[]): string => {
  const match = str.match(/#(\d+)$/);
  let newString: string;
  if (match) {
    const newIndex = Number(match[1]) + 1;
    newString = str.replace(/#(\d+)$/, '#' + newIndex);
  } else {
    newString = str + ' #1';
  }
  // if incremented name existing, increment more
  if (names.includes(newString)) {
    return cloneIncrementName(newString, names);
  }
  return newString;
};