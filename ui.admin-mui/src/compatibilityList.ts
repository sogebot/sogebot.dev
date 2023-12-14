type lastCompatibleCommit = string;
export const versions: {
  [version: string]: lastCompatibleCommit,
} = {
  '22.0.0 - 22.1.0':               '7961c0ab',
  '21.1.0 - 21.1.5':               '47fcd057',
  '21.0.0':                        '55b96061',
  '~19.3.0 || ~19.4.0 || ~20.0.0': '0509e1d6',
  '~19.2.0':                       '5b6ec5c5',
  '~19.1.0':                       'c52dfbce',
  '18.0.0':                        '3fbbd8a2',
} as const;

console.debug('Current compatibility list:', versions);