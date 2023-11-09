import { Box, ScopedCssBaseline, Stack, Typography } from '@mui/material';
import { EmotesCombo } from '@sogebot/backend/dest/database/entity/overlay';
import { random } from 'lodash';
import { nanoid } from 'nanoid';
import React from 'react';
import { useIntervalWhen } from 'rooks';

import type { Props } from './ChatItem';
import { getSocket } from '../../helpers/socket';

export const EmotesComboItem: React.FC<Props<EmotesCombo>> = ({ item, active }) => {
  const [ containerId ] = React.useState(`emotes-combo-` + nanoid());
  const [ count, setCount ] = React.useState(0);
  const [ url, setURL ] = React.useState<null | string>(null);
  const [ updatedAt, setUpdatedAt ] = React.useState(Date.now());
  const [ currentTime, setCurrentTime ] = React.useState(Date.now());

  // initialize sockets
  getSocket('/services/twitch', true);
  getSocket('/core/emotes', true);

  useIntervalWhen(() => {
    setCurrentTime(Date.now());
    if (!active) {
      setURL('https://static-cdn.jtvnw.net/emoticons/v2/25/static/light/3.0');
      setCount(random(item.showEmoteInOverlayThreshold, item.showEmoteInOverlayThreshold + 100));
      setUpdatedAt(Date.now());
    }
  }, 1000, true, true);

  React.useEffect(() => {
    console.log(`====== EMOTES COMBO ${containerId} ======`);
    listener();
  }, []);

  const listener = React.useCallback(() => {
    getSocket('/systems/emotescombo', true).on('combo', (data: { count: number; url: string }) => {
      setURL(data.url);
      setCount(data.count);
      setUpdatedAt(Date.now());
    });
  }, []);

  return <Box
    id={containerId}
    sx={{
      width:  '100%',
      height: '100%',
    }}>
    <Box
      sx={{
        width:    '100%',
        height:   '100%',
        position: 'relative',
        overflow: 'hidden',
      }}>
      <ScopedCssBaseline sx={{
        background: 'transparent', textTransform: 'none', height: '100%',
      }}>
        {(item.showEmoteInOverlayThreshold <= count && currentTime - updatedAt < item.hideEmoteInOverlayAfter * 1000 && url) && <Box sx={{
          display: 'flex', height: '100%',
        }}>
          <Stack direction='row' sx={{ margin: 'auto' }}>
            <Typography sx={{
              '& strong': { fontSize: '60px' },
              fontSize:   '25px',
              color:      '#fff',
              fontWeight: 'bold',
              textShadow: '0 0 10px #000, 1px 1px 1px #000',
              transform:  'translateY(-5px)',
            }}>
              <strong>{ count }</strong>*
            </Typography>
            <img src={ url }/>
          </Stack>
        </Box>}
      </ScopedCssBaseline>
    </Box>
  </Box>;
};