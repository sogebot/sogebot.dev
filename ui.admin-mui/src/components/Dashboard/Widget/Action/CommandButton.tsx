import { CommandItem } from '@backend/database/entity/dashboard';
import axios from 'axios';
import { useAtomValue } from 'jotai';
import React, { useCallback } from 'react';

import { ColorButton } from './_ColorButton';
import { loggedUserAtom } from '../../../../atoms';
import getAccessToken from '../../../../getAccessToken';

export const DashboardWidgetActionCommandButton: React.FC<{ item: CommandItem }> = ({
  item,
}) => {
  const user = useAtomValue(loggedUserAtom);

  const trigger = useCallback(() => {
    if (!user) {
      return;
    }
    console.log(`quickaction::trigger::${item.id}`);
    axios.post(`/api/widgets/quickaction/${item.id}?_action=trigger`, undefined, {
      headers: {
        Authorization: `Bearer ${getAccessToken()}`
      }
    });
  }, [ user, item ]);

  return (
    <ColorButton
      onClick={trigger}
      key={item.id}
      variant="contained"
      htmlcolor={item.options.color}
      disabled={item.options.command.length === 0}
      fullWidth
      sx={{
        borderRadius: 0 ,
        padding: item.options.label.length === 0 ? 0 : undefined,
      }}>
      {item.options.label.length === 0 && item.options.command.length === 0 && 'Command not set' }
      {item.options.label.length > 0 ? item.options.label : item.options.command}
    </ColorButton>
  );
};
