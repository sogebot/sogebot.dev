import { EmitData } from '@entity/overlay';
import { UserInterface } from '@entity/user';
import { atom } from 'jotai';

// save emit data per alert
export const anEmitData = atom<Record<string, null | (EmitData & {
  id:            string;
  isTTSMuted:    boolean;
  isSoundMuted:  boolean;
  TTSKey:        string;
  caster:        UserInterface | null;
  user:          UserInterface | null;
  recipientUser: UserInterface | null;
})>>({});

export const anExpectedSoundCount = atom(0);
export const anFinishedSoundCount = atom(0);
export const anWaitingForTTS = atom(false);
