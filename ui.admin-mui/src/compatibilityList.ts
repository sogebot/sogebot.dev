type lastCompatibleCommit = string;
export const versions: {
  [version: string]: lastCompatibleCommit,
} = {
  '~22.4.0':                       '69dc5d02',
  '~22.3.0':                       '35614a8f',
  '21.1.0 - 22.1.0':               '47fcd057',
  '21.0.0':                        '55b96061',
  '~19.3.0 || ~19.4.0 || ~20.0.0': '0509e1d6',
  '~19.2.0':                       '5b6ec5c5',
  '~19.1.0':                       'c52dfbce',
} as const;

console.debug('Current compatibility list:', versions);