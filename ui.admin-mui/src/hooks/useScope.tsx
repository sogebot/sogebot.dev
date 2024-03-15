import { useAtomValue } from 'jotai';

import { loggedUserAtom } from '../atoms';

export const useScope = (requiredScope: string) => {
  const user = useAtomValue(loggedUserAtom);
  return {
    read: !!user?.bot_scopes[localStorage.server].find((scope: string) => scope.includes(`${requiredScope}:read`)),
    manage: !!user?.bot_scopes[localStorage.server].find((scope: string) => scope.includes(`${requiredScope}:manage`))
  };
};