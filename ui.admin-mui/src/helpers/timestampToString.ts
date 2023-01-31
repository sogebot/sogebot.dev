export const timestampToString = (value: { hours: number; minutes: number; seconds: number }, showSeconds = false) => {
  const string = (value.hours ? `${value.hours}h` : '')
    + (value.minutes ? `${value.minutes}m` : '')
    + (value.seconds || showSeconds ? `${value.seconds}s` : '');
  return string;
};