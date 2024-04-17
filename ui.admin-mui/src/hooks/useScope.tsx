import { useAtomValue } from 'jotai';
import { useLocalstorageState } from 'rooks';

import { loggedUserAtom } from '../atoms';

export const useScope = (requiredScope: string) => {
  const user = useAtomValue(loggedUserAtom);
  const [ server ] = useLocalstorageState('server', 'https://demobot.sogebot.xyz');

  if (!user) {
    return {
      read: false,
      manage: false
    };
  }
  const scopes = user.bot_scopes ?? { [JSON.stringify(server)]: [] };
  return {
    read: !!(scopes[JSON.stringify(server)] ?? []).find((scope: string) => scope.includes(`${requiredScope}:read`)),
    manage: !!(scopes[JSON.stringify(server)] ?? []).find((scope: string) => scope.includes(`${requiredScope}:manage`))
  };
};