import { Box, Checkbox, CircularProgress, List, ListItem, ListItemButton, ListItemText, SxProps } from '@mui/material';
import React from 'react';

import { getSocket } from '../../../../helpers/socket';

export const DashboardWidgetBotChecklist: React.FC<{ sx: SxProps }> = ({
  sx,
}) => {
  const [ items, setItems ] = React.useState<string[]>([]);
  const [ checkedIdx, setCheckedIdx ] = React.useState<number[]>([]);
  const [ loading, setLoading ] = React.useState(true);

  const update = React.useCallback(() => {
    items.forEach((item, idx) => {
      const checkedItem = {
        id:          item,
        isCompleted: checkedIdx.includes(idx),
      };
      getSocket('/systems/checklist').emit('checklist::save', checkedItem, () => {
        console.log('Checklist item saved', checkedItem);
      });
    });
  }, [checkedIdx, items]);
  React.useEffect(() => {
    update();
  }, [checkedIdx, update]);

  const addtoCheckedIdx = React.useCallback((idx: number) => {
    setCheckedIdx([...checkedIdx, idx]);
  }, [checkedIdx]);

  React.useEffect(() => {
    if (!loading) {
      return;
    }
    getSocket('/systems/checklist').emit('generic::getAll', (err, itemsFromSocket, checkedItemsFromSocket) => {
      if (err) {
        return console.error(err);
      }

      // populate completed
      for (const item of checkedItemsFromSocket) {
        if (item.isCompleted) {
          const idx = itemsFromSocket.indexOf(item.id);
          if (idx >= 0) {
            addtoCheckedIdx(idx);
          }
        }
      }
      setItems(itemsFromSocket);
      setLoading(false);
    });
  }, [addtoCheckedIdx, loading]);

  const handleToggle = (idx: number) => {
    if (checkedIdx.includes(idx)) {
      setCheckedIdx(checkedIdx.filter(o => o !== idx));
    } else {
      setCheckedIdx([...checkedIdx, idx]);
    }
  };

  return (
    <Box sx={sx}>
      {loading && <Box sx={{
        display: 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center',
      }}>
        <CircularProgress />
      </Box>}

      {!loading  && <List sx={{ width: '100%' }}>
        {items.map((item, idx) => {
          return (
            <ListItem
              key={idx}
              secondaryAction={
                <Checkbox
                  edge="end"
                  onChange={() => handleToggle(idx)}
                  checked={checkedIdx.includes(idx)}
                />
              }
              disablePadding
            >
              <ListItemButton onClick={() => handleToggle(idx)}>
                <ListItemText primary={item} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      }
    </Box>
  );
};