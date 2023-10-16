import { EmitData } from '@sogebot/backend/dest/database/entity/alert';
import { UserInterface } from '@sogebot/backend/dest/database/entity/user';
import { atom } from 'jotai';

export const anEmitData = atom<null | EmitData & {
  id: string;
  isTTSMuted: boolean;
  isSoundMuted: boolean;
  TTSService: number;
  TTSKey: string;
  caster: UserInterface | null;
  user: UserInterface | null;
  recipientUser: UserInterface | null;
}>(null);