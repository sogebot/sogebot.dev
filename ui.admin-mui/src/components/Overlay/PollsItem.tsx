import {
  Box, Fade, LinearProgress, Stack, SxProps, Theme, Typography,
} from '@mui/material';
import { Polls } from '@sogebot/backend/src/database/entity/overlay';
import { isEqual } from 'lodash';
import React from 'react';
import { useSelector } from 'react-redux';
import { useIntervalWhen } from 'rooks';

import type { Props } from './ChatItem';
import { dayjs, setLocale } from '../../helpers/dayjsHelper';
import { getSocket } from '../../helpers/socket';
import { useTranslation } from '../../hooks/useTranslation';

const testValues = {
  'id':      'ed961efd-8a3f-4cf5-a9d0-e616c590cd2a',
  'title':   'Heads or Tails?',
  'choices': [
    {
      'id':         '4c123012-1351-4f33-84b7-43856e7a0f47',
      'title':      'Heads',
      'totalVotes': 452,
    },
    {
      'id':         '279087e3-54a7-467e-bcd0-c1393fcea4f0',
      'title':      'Tails',
      'totalVotes': 101,
    },
  ],
  'endDate':   new Date(Date.now() + 60 * 10000).toISOString(),
  'startDate': new Date().toISOString(),
};

export const PollsItem: React.FC<Props<Polls>> = ({ active, item }) => {
  // initialize socket
  getSocket('/overlays/polls', true);

  const { translate } = useTranslation();
  const lang = useSelector((state: any) => state.loader.configuration.lang );

  const [ ended, setEnded ] = React.useState(false);
  const [ currentTime, setCurrentTime ] = React.useState(Date.now());
  const [ lastUpdatedAt, setLastUpdatedAt ] = React.useState(0);
  const [ currentVote, setCurrentVote ] = React.useState<typeof testValues | null>(active ? null : testValues);

  React.useEffect(() => {
    setLocale(lang);
  }, [lang]);

  useIntervalWhen(() => {
    setCurrentTime(Date.now());
  }, 100, true, true);

  useIntervalWhen(() => {
    getSocket('/overlays/polls', true).emit('data', (data) => {
      console.log({ data });
      // force show if new vote
      if (currentVote === null) {
        setLastUpdatedAt(Date.now());
      }
      if (!isEqual(currentVote?.choices, data?.choices)) {
        setLastUpdatedAt(Date.now());
      }
      if (!data) {
        if (!ended) {
          setEnded(true);
        } else {
          setCurrentVote(null);
        }
      } else {
        setEnded(false);
        setCurrentVote(data);
      }
    });
  }, 5000, active === true, true);

  const inactivityTime = React.useMemo(() => currentTime - lastUpdatedAt, [ currentTime, lastUpdatedAt ]);
  const activeTime = React.useMemo(() => new Date(currentVote?.startDate ?? 0).getTime(), [ currentVote ]);

  const totalVotes = React.useMemo(() => {
    const votes = (currentVote?.choices || []).map(o => o.totalVotes);
    let _votes = 0;
    for (let i = 0, length = votes.length; i < length; i++) {
      _votes += votes[i];
    }
    return _votes;
  }, [ currentVote ]);

  const getPercentage = React.useCallback((index: number, toFixed?: number) => {
    const votes = (currentVote?.choices || []).map(o => o.totalVotes);
    let _votes = 0;
    for (let i = 0, length = votes.length; i < length; i++) {
      if (i === index) {
        _votes += votes[i];
      }
    }
    return Number((100 / totalVotes) * _votes || 0).toFixed(toFixed || 0);
  }, [ currentVote, totalVotes ]);

  React.useEffect(() => {
    console.log('====== POLLS ======');
  }, []);

  const theme = React.useMemo<SxProps<Theme> | undefined>(() => {
    if (item.theme === 'Soge\'s green') {
      return {
        backgroundColor: 'rgb(0 0 0 / 80%)',
        color:           '#f0f1f4',
        borderTop:       '5px solid #acd301',
        borderBottom:    '5px solid #acd301',
        p:               2,
        '& kbd':         {
          backgroundColor: 'black',
          color:           '#acd301',
          p:               0.2,
          px:              0.75,
          borderRadius:    '10px',
        },
        '& .footer': {
          textAlign: 'center', justifyContent: 'space-around',
        },
        '& .title': {
          fontWeight: 'bold',
          fontSize:   '1.2rem',
        },
        '& .space':     { pt: 2 },
        '& .highlight': {
          fontWeight: 'bold', color: '#acd301',
        },
        '& .progress': {
          height: '8px',backgroundColor: 'rgba(172 211 1 / 20%)',
        },
        '& .progress span': { backgroundColor: '#acd301' },
        '& .number':        {
          color:      '#acd301',
          fontSize:   '2rem',
          fontWeight: 'bold',
          pr:         '0.5rem',
        },
      };
    }

    if (item.theme === 'light') {
      return {
        backgroundColor: 'rgb(207 207 207)',
        color:           'black',
        borderTop:       '5px solid rgb(100 100 100)',
        borderBottom:    '5px solid rgb(100 100 100)',
        p:               2,
        '& kbd':         {
          backgroundColor: 'black',
          color:           'rgb(230 230 230)',
          p:               0.2,
          px:              0.75,
          borderRadius:    '10px',
        },
        '& .footer': {
          textAlign: 'center', justifyContent: 'space-around',
        },
        '& .title': {
          fontWeight: 'bold',
          fontSize:   '1.2rem',
        },
        '& .space':     { pt: 2 },
        '& .highlight': {
          fontWeight: 'bold', color: 'rgb(100 100 100)',
        },
        '& .progress': {
          height: '8px',backgroundColor: 'rgba(100 100 100 / 20%)',
        },
        '& .progress span': { backgroundColor: 'rgb(100 100 100)' },
        '& .number':        {
          color:      'rgb(100 100 100)',
          fontSize:   '2rem',
          fontWeight: 'bold',
          pr:         '0.5rem',
        },
      };
    }

    if (item.theme === 'dark') {
      return {
        backgroundColor: 'rgb(32 32 32)',
        color:           '#f0f1f4',
        borderTop:       '5px solid rgb(150 150 150)',
        borderBottom:    '5px solid rgb(150 150 150)',
        p:               2,
        '& kbd':         {
          backgroundColor: 'black',
          color:           'rgb(230 230 230)',
          p:               0.2,
          px:              0.75,
          borderRadius:    '10px',
        },
        '& .footer': {
          textAlign: 'center', justifyContent: 'space-around',
        },
        '& .title': {
          fontWeight: 'bold',
          fontSize:   '1.2rem',
        },
        '& .space':     { pt: 2 },
        '& .highlight': {
          fontWeight: 'bold', color: 'rgb(150 150 150)',
        },
        '& .progress': {
          height: '8px',backgroundColor: 'rgba(150 150 150 / 20%)',
        },
        '& .progress span': { backgroundColor: 'rgb(150 150 150)' },
        '& .number':        {
          color:      'rgb(150 150 150)',
          fontSize:   '2rem',
          fontWeight: 'bold',
          pr:         '0.5rem',
        },
      };
    }
    return undefined;
  }, [item]);

  return <Box sx={{
    height:        '100%',
    width:         '100%',
    textTransform: 'initial',
    display:       'grid',
    overflow:      'hidden',
    wordBreak:     'break-all',
    alignItems:    item.align === 'bottom' ? 'end' : 'start',
  }}>
    <Fade in={
      !ended && currentVote !== null && (!item.hideAfterInactivity || (item.hideAfterInactivity && inactivityTime < item.inactivityTime))
    }>
      {currentVote !== null ? <Box sx={{ ...theme }}>
        <Typography className='title'>{currentVote.title}</Typography>

        <Box className='space'/>

        {currentVote.choices.map((option, index: number) => <Box key={index}>
          <Stack direction='row'>
            <Typography className='number'>{index+1}</Typography>
            <Stack sx={{ width: '100%' }} spacing={0.5}>
              <Stack direction='row' justifyContent='space-between' >
                <Typography className='option'>{option.title}</Typography>
                <Typography className='percentage'>{ getPercentage(index, 1) }%</Typography>
              </Stack>
              <LinearProgress className='progress' variant="determinate" value={Number(getPercentage(index))} />
            </Stack>
          </Stack>
        </Box>)}

        <Box className='space'/>

        <Stack direction={'row'} className='footer'>
          <Typography>
            { translate('systems.polls.totalVotes') }
            {' '}
            <Typography component='span' className='highlight'>
              {totalVotes}
            </Typography>
          </Typography>
          <Typography>
            { translate('systems.polls.activeFor') }
            {' '}
            <Typography component='span' className='highlight'>
              { dayjs().from(dayjs(activeTime), true) }
            </Typography>
          </Typography>
        </Stack>
      </Box>
        : <Box/>}
    </Fade>
  </Box>;
};