import { Link, Twitter } from '@mui/icons-material';
import {
  Alert, Box, CircularProgress, IconButton, List, ListItem, ListItemIcon, ListItemSecondaryAction, ListItemText, Typography,
} from '@mui/material';
import { grey } from '@mui/material/colors';
import { WidgetSocialInterface } from '@sogebot/backend/src/database/entity/widget';
import { dayjs } from '@sogebot/ui-helpers/dayjsHelper';
import React from 'react';
import { useIntervalWhen } from 'rooks';

import { getSocket } from '~/src/helpers/socket';

export const DashboardWidgetBotSocial: React.FC<{ className: string }> = ({
  className,
}) => {
  const [ items, setItems ] = React.useState<WidgetSocialInterface[]>([]);
  const [ loading, setLoading ] = React.useState(true);

  useIntervalWhen(() => {
    getSocket('/widgets/social').emit('generic::getAll', (err, data) => {
      if (err) {
        return console.error(err);
      }
      setItems(data);
      setLoading(false);
    });
  }, 1000, true, true);

  return (
    <Box className={className}>
      {loading && <Box sx={{
        display: 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center',
      }}>
        <CircularProgress />
      </Box>}

      {!loading && <Box>
        {items.length === 0 && <Alert severity="info">To fill social widget, you need to add tweet events with hashtags. Then all new posts will be added to this widget.</Alert>}
        {items.length > 0 && <List>
          {items.map((item) => <ListItem key={item.id}>
            <ListItemIcon>
              <Twitter htmlColor='#1DA1F2'/>
            </ListItemIcon>
            <ListItemText secondary={<Typography color={grey[400]} fontSize={12}>{ item.username }, { dayjs(item.timestamp).format('LL LTS') }</Typography>}>
              { item.text }
            </ListItemText>
            <ListItemSecondaryAction>
              <IconButton href={item.url} target='_blank'>
                <Link/>
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>)}
        </List>}
      </Box>}
    </Box>
  );
};