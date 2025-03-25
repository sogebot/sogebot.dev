import { DividerItem } from '@entity/dashboard';
import { Divider } from '@mui/material';
import React, {  } from 'react';

export const DashboardWidgetActionDividerButton: React.FC<{ item: DividerItem }> = ({
  item,
}) => {
  return <Divider sx={{
    userSelect: 'none',
    alignItems: 'center',
    color: item.options.color,
    height: `${item.options.height}px !important`,
    fontSize: `clamp(10px, ${item.options.height/2}px, 18px) !important`,
  }}>
    {item.options.label.length > 0 && item.options.label}
  </Divider>;
};