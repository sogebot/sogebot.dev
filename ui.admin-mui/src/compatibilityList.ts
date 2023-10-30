type lastCompatibleCommit = string;
export const versions: {
  [version: string]: lastCompatibleCommit,
} = {
  '~19.3.0 || ~19.4.0 || ~20.0.0':            '659aa89',
  '~19.2.0':                                  '5b6ec5c5',
  '~19.1.0':                                  'c52dfbce',
  '~16.12.0 || ~16.13.0 || ~17.0.0':          '30e2ad4f',
  '16.10.3 || ~16.11.0':                      '66b524f9',
  '~16.9.0 || 16.10.0 || 16.10.1 || 16.10.2': 'a66724b5',
  '<16.8.0 || ~16.8.0':                       '01ba7f41',
} as const;