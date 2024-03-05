export const rules = (type: string | null):[string, string][] => {
  switch (type) {
    case 'promo':
      return [['username', 'string'], ['game', 'string'], ['message', 'string']];
    case 'cheer':
    case 'subcommunitygift':
      return [['username', 'string'], ['amount', 'number'], ['tier', 'tier']];
    case 'raid':
      return [['username', 'string'], ['amount', 'number']];
    case 'sub':
      return [['username', 'string'], ['tier', 'tier']];
    case 'resub':
      return [['username', 'string'], ['tier', 'tier'], ['amount', 'number']];
    case 'subgift':
      return [['username', 'string'], ['recipient', 'string'], ['amount', 'number'], ['tier', 'tier']];
    case 'cmdredeem':
      return [['recipient', 'string'], ['amount', 'number'], ['name', 'string'], ['name', 'message']];
    case 'rewardredeem':
      return [['recipient', 'string'], ['rewardId', 'reward']];
    case 'tip':
      return [['username', 'string'], ['amount', 'number'], ['service', 'service']];
  }
  return [['username', 'string']];
};