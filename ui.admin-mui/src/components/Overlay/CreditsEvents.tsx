import { DiamondTwoTone, KeyboardDoubleArrowRightTwoTone, TheaterComedyTwoTone } from '@mui/icons-material';
import { Box, Typography } from '@mui/material';
import { CreditsScreenEvents , EmitData } from '@sogebot/backend/dest/database/entity/overlay';
import type { Event } from '@sogebot/backend/dest/overlays/credits';
import { capitalize, get, groupBy } from 'lodash';
import React from 'react';

import type { Props } from './ChatItem';
import { getSocket } from '../../helpers/socket';
import { shadowGenerator, textStrokeGenerator } from '../../helpers/text';
import { useAppSelector } from '../../hooks/useAppDispatch';
import { loadFont } from '../Accordion/Font';

export const defaultHeaderValues: {
  [Type in EmitData['event']]: string
} = {
  follow:           'Follows',
  cheer:            'Cheers',
  custom:           'Custom Events',
  promo:            'Promos',
  raid:             'Raids',
  resub:            'Resubscriptions',
  rewardredeem:     'Reward redeems',
  sub:              'Subscribers',
  subcommunitygift: 'Community Gifts',
  subgift:          'Gift Subscriptions',
  tip:              'Tips',
} as const;

export const CreditsEvents: React.FC<Props<CreditsScreenEvents> & { onLoaded?: () => void }>
= ({ item, active, onLoaded }) => {
  const { configuration } = useAppSelector((state: any) => state.loader);

  const [ events, setEvents ] = React.useState<Event[]>([]);
  const [ isLoading, setIsLoading ] = React.useState(true);

  React.useEffect(() => {
    loadFont(item.headerFont.family);
    loadFont(item.itemFont.family);
    loadFont(item.highlightFont.family);
  }, [active, item]);

  React.useEffect(() => {
    getSocket('/overlays/credits').emit('load', async (err: any, opts: any) => {
      if (err) {
        console.error(err);
        return;
      }
      setEvents(opts.events);
      setIsLoading(false);
      onLoaded && onLoaded();
    });
  }, []);

  const translateEvents = (event: string) => {
    return capitalize(
      event in item.headers && item.headers[event as keyof typeof item.headers].length > 0
        ? item.headers[event as keyof typeof item.headers]
        : event in defaultHeaderValues
          ? defaultHeaderValues[event as keyof typeof defaultHeaderValues]
          : event,
    );
  };

  return <Box sx={{
    width:         '100%',
    height:        '100%',
    position:      'relative',
    overflow:      'visible',
    userSelect:    'none',
    textTransform: 'none',
    lineHeight:    'initial',
    pb:            2,
  }}>
    {!isLoading && <>
      {Object.entries(groupBy(events, 'event')).filter(data => !item.excludeEvents.includes(data[0] as any)).map(data => <React.Fragment key={data[0]}>
        <Typography sx={{
          textAlign:  item.headerFont.align,
          color:      item.headerFont.color,
          fontFamily: item.headerFont.family,
          fontWeight: item.headerFont.weight,
          fontSize:   item.headerFont.size + 'px',
          pl:         `${item.headerFont.pl}px`,
          pr:         `${item.headerFont.pr}px`,
          pb:         `${item.headerFont.pb}px`,
          pt:         `${item.headerFont.pt}px`,
          textShadow: [textStrokeGenerator(item.headerFont.borderPx, item.headerFont.borderColor), shadowGenerator(item.headerFont.shadow)].filter(Boolean).join(', '),
        }}>{translateEvents(data[0])}</Typography>

        <Box sx={{
          columnCount: item.columns,
          px:          10,
        }}>
          {data[1].map((it, idx) => <Typography component='div' key={`${it.event}-${idx}`} sx={{
            textAlign:   item.itemFont.align,
            color:       item.itemFont.color,
            fontFamily:  item.itemFont.family,
            fontWeight:  item.itemFont.weight,
            fontSize:    item.itemFont.size + 'px',
            pl:          `${item.itemFont.pl}px`,
            pr:          `${item.itemFont.pr}px`,
            pb:          `${item.itemFont.pb}px`,
            pt:          `${item.itemFont.pt}px`,
            breakInside: 'avoid-column',
            lineHeight:  1,
            textShadow:  [textStrokeGenerator(item.itemFont.borderPx, item.itemFont.borderColor), shadowGenerator(item.itemFont.shadow)].filter(Boolean).join(', '),
          }}>
            {['follow', 'sub', 'custom', 'promo'].includes(it.event) && it.username}

            {it.event === 'cheer' && <Box sx={{ breakInside: 'avoid-column' }}>
              {it.username}
              {' '}
              <DiamondTwoTone sx={{ stroke: item.itemFont.borderPx > 0 ? item.itemFont.borderColor : undefined }}/>
              {' '}
              <Typography component='span' sx={{
                textAlign:  item.highlightFont.align,
                color:      item.highlightFont.color,
                fontFamily: item.highlightFont.family,
                fontWeight: item.highlightFont.weight,
                fontSize:   item.highlightFont.size + 'px',
                textShadow: [textStrokeGenerator(item.highlightFont.borderPx, item.highlightFont.borderColor), shadowGenerator(item.highlightFont.shadow)].filter(Boolean).join(', '),
              }}>
                {it.values?.bits}
              </Typography>
            </Box>}

            {it.event === 'tip' && <Box sx={{ breakInside: 'avoid-column' }}>
              {it.username}
              {' '}
              <Typography component='span' sx={{
                textAlign:  item.highlightFont.align,
                color:      item.highlightFont.color,
                fontFamily: item.highlightFont.family,
                fontWeight: item.highlightFont.weight,
                fontSize:   item.highlightFont.size + 'px',
                textShadow: [textStrokeGenerator(item.highlightFont.borderPx, item.highlightFont.borderColor), shadowGenerator(item.highlightFont.shadow)].filter(Boolean).join(', '),
              }}>
                {Intl.NumberFormat(configuration.lang, {
                  style: 'currency', currency: get(it.values, 'currency', 'USD'),
                }).format(Number(get(it.values, 'amount', 0)))}
              </Typography>
            </Box>}

            {it.event === 'raid' && <Box sx={{ breakInside: 'avoid-column' }}>
              {it.username}
              {' '}
              <TheaterComedyTwoTone sx={{ stroke: item.itemFont.borderPx > 0 ? item.itemFont.borderColor : undefined }}/>
              {' '}
              <Typography component='span' sx={{
                textAlign:  item.highlightFont.align,
                color:      item.highlightFont.color,
                fontFamily: item.highlightFont.family,
                fontWeight: item.highlightFont.weight,
                fontSize:   item.highlightFont.size + 'px',
                textShadow: [textStrokeGenerator(item.highlightFont.borderPx, item.highlightFont.borderColor), shadowGenerator(item.highlightFont.shadow)].filter(Boolean).join(', '),
              }}>
                {it.values?.viewers}
              </Typography>
            </Box>}

            {it.event === 'resub' && <Box sx={{ breakInside: 'avoid-column' }}>
              {it.username}
              <Typography sx={{
                textAlign:  item.highlightFont.align,
                color:      item.highlightFont.color,
                fontFamily: item.highlightFont.family,
                fontWeight: item.highlightFont.weight,
                fontSize:   item.highlightFont.size + 'px',
                textShadow: [textStrokeGenerator(item.highlightFont.borderPx, item.highlightFont.borderColor), shadowGenerator(item.highlightFont.shadow)].filter(Boolean).join(', '),
              }}>
                {it.values?.subCumulativeMonths}{' '}
                <Typography component='span' sx={{
                  textAlign:  item.itemFont.align,
                  color:      item.itemFont.color,
                  fontFamily: item.itemFont.family,
                  fontWeight: item.itemFont.weight,
                  fontSize:   item.itemFont.size + 'px',
                  textShadow: [textStrokeGenerator(item.itemFont.borderPx, item.itemFont.borderColor), shadowGenerator(item.itemFont.shadow)].filter(Boolean).join(', '),
                }}>
                  {it.values?.subCumulativeMonthsName}
                </Typography>
              </Typography>
            </Box>}

            {it.event === 'rewardredeem' && <Box sx={{ breakInside: 'avoid-column' }}>
              {it.username}
              {' '}
              <KeyboardDoubleArrowRightTwoTone sx={{ stroke: item.itemFont.borderPx > 0 ? item.itemFont.borderColor : undefined }}/>
              {' '}
              <Typography component='span' sx={{
                textAlign:  item.highlightFont.align,
                color:      item.highlightFont.color,
                fontFamily: item.highlightFont.family,
                fontWeight: item.highlightFont.weight,
                fontSize:   item.highlightFont.size + 'px',
                position:   'relative',
                zIndex:     -1,
                textShadow: [textStrokeGenerator(item.highlightFont.borderPx, item.highlightFont.borderColor), shadowGenerator(item.highlightFont.shadow)].filter(Boolean).join(', '),
              }}>{it.values?.titleOfReward}</Typography>
            </Box>}

            {it.event === 'subcommunitygift' && <Box sx={{ breakInside: 'avoid-column' }}>
              {it.username}
              {' '}
              <KeyboardDoubleArrowRightTwoTone sx={{ stroke: item.itemFont.borderPx > 0 ? item.itemFont.borderColor : undefined }}/>
              {' '}
              <Typography component='span' sx={{
                textAlign:  item.highlightFont.align,
                color:      item.highlightFont.color,
                fontFamily: item.highlightFont.family,
                fontWeight: item.highlightFont.weight,
                fontSize:   item.highlightFont.size + 'px',
                position:   'relative',
                zIndex:     -1,
                textShadow: [textStrokeGenerator(item.highlightFont.borderPx, item.highlightFont.borderColor), shadowGenerator(item.highlightFont.shadow)].filter(Boolean).join(', '),
              }}>{it.values?.count}</Typography>
            </Box>}

            {it.event === 'subgift' && <Box sx={{ breakInside: 'avoid-column' }}>
              {it.values!.fromUsername}
              {' '}
              <KeyboardDoubleArrowRightTwoTone sx={{ stroke: item.itemFont.borderPx > 0 ? item.itemFont.borderColor : undefined }}/>
              {' '}
              <Typography component='span' sx={{
                textAlign:  item.highlightFont.align,
                color:      item.highlightFont.color,
                fontFamily: item.highlightFont.family,
                fontWeight: item.highlightFont.weight,
                fontSize:   item.highlightFont.size + 'px',
                position:   'relative',
                zIndex:     -1,
                textShadow: [textStrokeGenerator(item.highlightFont.borderPx, item.highlightFont.borderColor), shadowGenerator(item.highlightFont.shadow)].filter(Boolean).join(', '),
              }}>{it.username}</Typography>
            </Box>}
          </Typography>)}
        </Box>
      </React.Fragment>) }
    </>}
  </Box>;
};