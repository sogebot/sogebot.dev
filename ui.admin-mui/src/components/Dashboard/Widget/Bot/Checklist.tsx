import { Box, Checkbox, CircularProgress, List, ListItem, ListItemButton, ListItemText, SxProps } from '@mui/material';
import axios from 'axios';
import React from 'react';

import getAccessToken from '../../../../getAccessToken';
import { useScope } from '../../../../hooks/useScope';

export const DashboardWidgetBotChecklist: React.FC<{ sx: SxProps }> = ({
  sx,
}) => {
  const [ items, setItems ] = React.useState<{
    id: string; isCompleted: boolean;
  }[]>([]);
  const [ loading, setLoading ] = React.useState(true);
  const scope = useScope('checklist');

  React.useEffect(() => {
    if (!loading) {
      return;
    }

    axios.get(`/api/systems/checklist`, { headers: { authorization: `Bearer ${getAccessToken()}` } })
      .then(({ data }) => {
        if (data.status === 'success') {
          setItems(data.data);
          setLoading(false);
        }
      });
  }, [loading]);

  const handleToggle = (item: typeof items[number]) => {
    setItems(it => {
      const idx = it.findIndex(o => o.id === item.id);
      it[idx].isCompleted = !it[idx].isCompleted;
      axios.post(`/api/systems/checklist`, it[idx], { headers: { authorization: `Bearer ${getAccessToken()}` } });
      return [...it];
    });
    return;
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
                  disabled={!scope.manage}
                  edge="end"
                  onChange={() => handleToggle(item)}
                  checked={item.isCompleted}
                />
              }
              disablePadding
            >
              <ListItemButton disabled={!scope.manage} onClick={() => handleToggle(item)}>
                <ListItemText primary={item.id} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      }
    </Box>
  );
};