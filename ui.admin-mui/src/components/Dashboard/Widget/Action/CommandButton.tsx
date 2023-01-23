import { CommandItem } from '@sogebot/backend/src/database/entity/dashboard';
import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { ColorButton } from './_ColorButton';
import { getSocket } from '../../../../helpers/socket';

export const DashboardWidgetActionCommandButton: React.FC<{ item: CommandItem }> = ({
  item,
}) => {
  const { user } = useSelector((state: any) => state.user);

  const trigger = useCallback(() => {
    console.log(`quickaction::trigger::${item.id}`);
    getSocket('/widgets/quickaction').emit('trigger', {
      user: {
        userId: user.id, userName: user.login,
      },
      id: item.id,
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
      sx={{ borderRadius: 0 }}>
      {item.options.label.length === 0 && item.options.command.length === 0 && 'Command not set' }
      {item.options.label.length > 0 ? item.options.label : item.options.command}
    </ColorButton>
  );
};
