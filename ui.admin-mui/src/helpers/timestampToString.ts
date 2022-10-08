export const timestampToString = (value: { hours: number; minutes: number; seconds: number }) => {
  const string = (value.hours ? `${value.hours}h` : '')
    + (value.minutes ? `${value.minutes}m` : '')
    + (value.seconds ? `${value.seconds}s` : '');
  return string;
};