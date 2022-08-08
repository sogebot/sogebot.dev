import {
  DAY, HOUR, MINUTE, SECOND,
} from '@sogebot/ui-helpers/constants';

export default function toReadableMiliseconds (value: number) {
  const days = Math.floor(value / DAY);
  const hours = Math.floor((value - days * DAY) / HOUR);
  const minutes = Math.floor((value - (days * DAY) - (hours * HOUR)) / MINUTE);
  const seconds = Math.floor((value - (days * DAY) - (hours * HOUR) - (minutes * MINUTE)) / SECOND);

  let output = '';
  if (days > 0) {
    output += `${days}d `;
  }
  if (hours > 0) {
    output += `${hours}h `;
  }
  if (minutes > 0) {
    output += `${minutes}m `;
  }
  if (seconds > 0) {
    output += `${seconds}s `;
  }
  return output.trim();
}