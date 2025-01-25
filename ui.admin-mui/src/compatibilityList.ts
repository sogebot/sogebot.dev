// commits from https://github.com/sogebot/sogebot.dev
type lastCompatibleCommit = string;
export const versions: {
  [version: string]: lastCompatibleCommit,
} = {
  '23.4.7 - 23.5.8':               'c0ad623c',
  '23.2.1 - 23.4.6':               '67787736',
  '23.1.3 - 23.2.0':               'c6940c37',
  '22.12.1 - 23.1.2':              'f1e1a0aa',
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
