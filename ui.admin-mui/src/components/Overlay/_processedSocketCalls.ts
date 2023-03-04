const ids: string[] = [];

export const isAlreadyProcessed = (id: string) => {
  const isProcessed = ids.includes(id);
  if (isProcessed) {
    return true;
  } else {
    ids.push(id);
    if (ids.length > 20) {
      ids.shift();
    }
    return false;
  }
};