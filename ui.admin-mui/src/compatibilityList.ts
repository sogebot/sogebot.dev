type lastCompatibleCommit = string;
export const versions: {
  [version: string]: lastCompatibleCommit,
} = {
  '22.10.0 - 22.12.0':             '3fd6c3c2',
  '22.7.0 - 22.9.0':               '038e2021',
  '22.6.3':                        'ece54717',
  '22.6.0 - 22.6.2':               'db397597',
  '~22.5.0':                       '5422a80e',
  '~22.4.0':                       '69dc5d02',
  '~22.3.0':                       '35614a8f',
  '21.1.0 - 22.1.0':               '47fcd057',
  '21.0.0':                        '55b96061',
} as const;

console.debug('Current compatibility list:', versions);
