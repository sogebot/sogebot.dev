import { Box } from '@mui/material';
import { EventListInterface } from '@sogebot/backend/dest/database/entity/eventList';
import { Eventlist } from '@sogebot/backend/dest/database/entity/overlay';
import axios from 'axios';
import orderBy from 'lodash/orderBy';
import React from 'react';
import { useIntervalWhen } from 'rooks';

import type { Props } from './ChatItem';
import { shadowGenerator, textStrokeGenerator } from '../../helpers/text';
import { useAppSelector } from '../../hooks/useAppDispatch';
import { useTranslation } from '../../hooks/useTranslation';
import { loadFont } from '../Accordion/Font';

export const EventlistItem: React.FC<Props<Eventlist>> = ({ item, active }) => {
  const [ events, setEvents ] = React.useState<(EventListInterface & { summary: string; username?: string })[]>([]);
  const { translate } = useTranslation();
  const { configuration } = useAppSelector(state => state.loader);

  const [ fadePerItem, setFadePerItem ] = React.useState(100 / item.count);

  React.useEffect(() => {
    setFadePerItem(100 / events.length);
  }, [ events ]);

  useIntervalWhen(() => {
    axios.get('/api/overlays/eventlist?ignore=' + JSON.stringify(item.ignore) + '&limit=' + item.count).then(({ data }) => {
      setEvents(orderBy(data.data, 'timestamp', item.order).filter(o => !o.isHidden).map((o) => {
        const values = JSON.parse(o.values_json);
        if (o.event === 'resub') {
          return {
            ...o, summary: values.subCumulativeMonths + 'x ' + translate('overlays-eventlist-resub'),
          };
        } else if (o.event === 'cheer') {
          return {
            ...o, summary: values.bits + ' ' + translate('overlays-eventlist-cheer'),
          };
        } else if (o.event === 'tip') {
          return {
            ...o,
            summary: Intl.NumberFormat(configuration.lang, {
              style: 'currency', currency: values.currency,
            }).format(values.amount),
          };
        } else if (o.event === 'rewardredeem') {
          return {
            ...o, summary: values.titleOfReward,
          };
        } else {
          return {
            ...o, summary: translate('overlays-eventlist-' + o.event),
          };
        }
      }));
    });
  }, active ? 5000 : 100, true, true);

  React.useEffect(() => {
    loadFont(item.usernameFont.family);
    loadFont(item.eventFont.family);

    if (active) {
      console.log(`====== EVENTLIST ======`);
    }
  }, [item]);

  return <Box sx={{
    width: '100%', height: '100%', overflow: 'hidden', display: 'flex', justifyContent: 'center',
  }}>
    <Box sx={{
      textAlign: 'center',
      alignSelf: 'baseline',
      width:     item.inline ? undefined : '100%',
    }}>
      {events.map((event, idx) => <React.Fragment key={event.id}>
        <Box sx={{
          opacity:    item.fadeOut ? `${(100 - fadePerItem * idx) / 100}` : undefined,
          display:    item.inline ? 'inline-flex' : undefined,
          px:         item.inline ? `${item.spaceBetweenItems / 2}px` : undefined,
          mb:         item.inline ? undefined : `${item.spaceBetweenItems}px`,
          alignItems: item.inline ? 'baseline' : undefined,
        }}>
          {item.display.map((display, dIdx) =>
            <Box
              key={display + idx}
              sx={{
                display:       'inline-block',
                fontSize:      `${(display === 'username' ? item.usernameFont : item.eventFont).size}px`,
                lineHeight:    `${(display === 'username' ? item.usernameFont : item.eventFont).size}px`,
                color:         `${(display === 'username' ? item.usernameFont : item.eventFont).color}`,
                fontFamily:    (display === 'username' ? item.usernameFont : item.eventFont).family,
                fontWeight:    (display === 'username' ? item.usernameFont : item.eventFont).weight,
                textAlign:     (display === 'username' ? item.usernameFont : item.eventFont).align ?? 'right',
                textShadow:    [textStrokeGenerator((display === 'username' ? item.usernameFont : item.eventFont).borderPx, (display === 'username' ? item.usernameFont : item.eventFont).borderColor), shadowGenerator(item.eventFont.shadow)].filter(Boolean).join(', '),
                width:         item.inline ? undefined : `calc(50% - ${item.spaceBetweenEventAndUsername / 2}px)`,
                textTransform: 'none',
                mr:            dIdx === 0 ? `${item.spaceBetweenEventAndUsername / 2}px` : undefined,
                ml:            dIdx === 1 ? `${item.spaceBetweenEventAndUsername / 2}px` : undefined,
              }}>
              { display === 'username' ? event.username : event.summary }
            </Box>,
          )}
        </Box>
      </React.Fragment>)}
    </Box>
  </Box>;
};