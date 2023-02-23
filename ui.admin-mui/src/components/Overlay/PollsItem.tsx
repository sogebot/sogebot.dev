import {
  Box, Fade, LinearProgress, Stack, SxProps, Theme, Typography,
} from '@mui/material';
import { Polls } from '@sogebot/backend/dest/database/entity/overlay';
import HTMLReactParser from 'html-react-parser';
import { isEqual } from 'lodash';
import React from 'react';
import { useSelector } from 'react-redux';
import { useIntervalWhen } from 'rooks';

import type { Props } from './ChatItem';
import { dayjs, setLocale } from '../../helpers/dayjsHelper';
import { getSocket } from '../../helpers/socket';
import { useTranslation } from '../../hooks/useTranslation';

export const PollsItem: React.FC<Props<Polls>> = ({ active, item }) => {
  // initialize socket
  getSocket('/overlays/polls', true);

  const { translate } = useTranslation();
  const lang = useSelector((state: any) => state.loader.configuration.lang );

  const [ ended, setEnded ] = React.useState(false);
  const [ voteCommand, setVoteCommand ] = React.useState('!vote');
  const [ currentTime, setCurrentTime ] = React.useState(Date.now());
  const [ lastUpdatedAt, setLastUpdatedAt ] = React.useState(0);
  const [ currentVote, setCurrentVote ] = React.useState<any | null>(active ? null : {
    type:     'normal',
    title:    'What is my question?',
    openedAt: new Date().toISOString(),
    closedAt: null,
    options:  [
      'yes', 'no', 'maybe',
    ],
    votes: [{
      votedBy: 'test',
      votes:   1,
      option:  1,
    }, {
      votedBy: 'test',
      votes:   2,
      option:  0,
    }],
  });

  React.useEffect(() => {
    console.log({ lang });
    setLocale(lang);
  }, [lang]);

  useIntervalWhen(() => {
    setCurrentTime(Date.now());
  }, 100, true, true);

  useIntervalWhen(() => {
    getSocket('/overlays/polls', true).emit('data', (cb) => {
      // force show if new vote
      if (currentVote === null) {
        setLastUpdatedAt(Date.now());
      }
      if (currentVote?.votes && cb?.votes) {
        if (!isEqual(currentVote.votes, cb.votes)) {
          setLastUpdatedAt(Date.now());
        }
      }
      if (!cb) {
        if (!ended) {
          setEnded(true);
        } else {
          setCurrentVote(null);
        }
      } else {
        setEnded(false);
        setCurrentVote(cb);
      }
    });
  }, 5000, active === true, true);

  const inactivityTime = React.useMemo(() => currentTime - lastUpdatedAt, [ currentTime, lastUpdatedAt ]);
  const activeTime = React.useMemo(() => new Date(currentVote?.openedAt ?? 0).getTime(), [ currentVote ]);

  const totalVotes = React.useMemo(() => {
    const votes = currentVote?.votes || 0;
    let _votes = 0;
    for (let i = 0, length = votes.length; i < length; i++) {
      _votes += votes[i].votes;
    }
    return _votes;
  }, [ currentVote ]);

  const getPercentage = React.useCallback((index: number, toFixed?: number) => {
    const votes = currentVote?.votes || 0;
    let _votes = 0;
    for (let i = 0, length = votes.length; i < length; i++) {
      if (votes[i].option === index) {
        _votes += votes[i].votes;
      }
    }
    return Number((100 / totalVotes) * _votes || 0).toFixed(toFixed || 0);
  }, [ currentVote, totalVotes ]);

  React.useEffect(() => {
    console.log('====== POLLS ======');
    getSocket('/overlays/polls', true).emit('getVoteCommand', (cmd: string) => setVoteCommand(cmd));
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
        '& .helper': {
          textAlign:  'center',
          paddingTop: '0.5rem',
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
        '& .helper': {
          textAlign:  'center',
          paddingTop: '0.5rem',
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
        '& .helper': {
          textAlign:  'center',
          paddingTop: '0.5rem',
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
    alignItems:    item.align === 'bottom' ? 'end' : 'start',
  }}>
    <Fade in={
      !ended && currentVote !== null && (!item.hideAfterInactivity || (item.hideAfterInactivity && inactivityTime < item.inactivityTime))
    }>
      {currentVote !== null ? <Box sx={{ ...theme }}>
        <Typography className='title'>{currentVote.title}</Typography>

        {currentVote.type === 'normal' && <Typography className='helper'>
          { translate('systems.polls.overlay.type') } <kbd>{ voteCommand } 1</kbd>, <kbd>{ voteCommand } 2</kbd>,
          { translate('systems.polls.overlay.inChatToVote') }
        </Typography>}
        {currentVote.type === 'numbers' && <Typography className='helper'>
          { translate('systems.polls.overlay.type') } <kbd>1</kbd>, <kbd>2</kbd>,
          { translate('systems.polls.overlay.inChatToVote') }
        </Typography>}
        {currentVote.type === 'tips' && <Typography className='helper'>
          { translate('systems.polls.overlay.add') } <kbd>#vote1</kbd>, <kbd>#vote2</kbd>,
          { HTMLReactParser(translate('systems.polls.overlay.toYourMessage').replace('$type', translate('systems.polls.overlay.tips')))}
        </Typography>}
        {currentVote.type === 'bits' && <Typography className='helper'>
          { translate('systems.polls.overlay.add') } <kbd>#vote1</kbd>, <kbd>#vote2</kbd>,
          { HTMLReactParser(translate('systems.polls.overlay.toYourMessage').replace('$type', translate('systems.polls.overlay.bits')))}
        </Typography>}

        <Box className='space'/>

        {currentVote.options.map((option: string, index: number) => <Box key={index}>
          <Stack direction='row'>
            <Typography className='number'>{index+1}</Typography>
            <Stack sx={{ width: '100%' }} spacing={0.5}>
              <Stack direction='row' justifyContent='space-between' >
                <Typography className='option'>{option}</Typography>
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
              {currentVote.type === 'tips'
                ?  Number(totalVotes).toFixed(1)
                :  totalVotes
              }
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