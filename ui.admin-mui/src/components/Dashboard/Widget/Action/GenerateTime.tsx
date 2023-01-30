import {
  DAY, HOUR, MINUTE, SECOND,
} from '../../../../constants';

export const GenerateTime = (timestamp: null | number, showMilliseconds: boolean) => {
  if (timestamp === null) {
    return '--:--:--';
  }
  const days = Math.floor(timestamp / DAY);
  const hours = Math.floor((timestamp - days * DAY) / HOUR);
  const minutes = Math.floor((timestamp - (days * DAY) - (hours * HOUR)) / MINUTE);
  const seconds = Math.floor((timestamp - (days * DAY) - (hours * HOUR) - (minutes * MINUTE)) / SECOND);
  let millis: number | string = Math.floor((timestamp - (days * DAY) - (hours * HOUR) - (minutes * MINUTE) - (seconds * SECOND)) / 10);

  if (millis < 10) {
    millis = `0${millis}`;
  }

  let output = '';
  if (days > 0) {
    output += `${days}d`;
  }

  output += `${hours < 10 ? '0' : ''}${hours}:${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  if (showMilliseconds) {
    output += `<small>.${millis}</small>`;
  }
  return output;
};