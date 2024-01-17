import { mdiCrown, mdiDiamond, mdiTwitch, mdiWrench, mdiYoutube } from '@mdi/js';
import Icon from '@mdi/react';
import { ChatTwoTone, SplitscreenTwoTone, UnfoldLessTwoTone, UnfoldMoreTwoTone } from '@mui/icons-material';
import { TabContext, TabList } from '@mui/lab';
import { Box, Card, Divider, IconButton, Menu, MenuItem, Stack, Tab, Typography } from '@mui/material';
import HTMLReactParser from 'html-react-parser';
import PopupState, { bindMenu, bindTrigger } from 'material-ui-popup-state';
import React from 'react';
import { useIntervalWhen, useLocalstorageState } from 'rooks';
import SimpleBar from 'simplebar-react';

import { getSocket } from '../../../helpers/socket';
import { useAppSelector } from '../../../hooks/useAppDispatch';
import { useTranslation } from '../../../hooks/useTranslation';
import { OverlayState } from '../../../store/overlaySlice';
import theme from '../../../theme';
import { isAlreadyProcessed } from '../../Overlay/_processedSocketCalls';
import { generateColorFromString, hexToHSL } from '../../Overlay/ChatItem';
import { classes } from '../../styles';

const SimpleMessage = ({ message }: { message: OverlayState['chat']['messages'][0] }) => {
  return <Box id={message.id} key={message.id} sx={{
    '.simpleChatImage': {
      position:    'relative',
      display:     'inline-block',
      marginRight: '1px',
      marginLeft:  '1px',
    },
    '.simpleChatImage .emote': {
      height:    `24px`,
      objectFit: 'contain',
      overflow:  'visible',
      top:       0,
      bottom:    0,
      margin:    'auto',
      verticalAlign: 'bottom',
    },
  }}>
    {/* show timestamp */}
    <Typography component='span' sx={{
      pr:         0.5,
    }}>{new Date(message.timestamp).toLocaleTimeString('default', {
        hour: '2-digit', minute: '2-digit', second: '2-digit',
      })}</Typography>

    <Box sx={{
      pr: 0.5, display: 'inline',
    }}>
      <Box key={message.timestamp + message.id} sx={{
        position:    'relative',
        display:     'inline-block',
        marginRight: '1px',
        width:       `16px`,
        verticalAlign: 'text-bottom',

      }}>
        {message.service === 'youtube'
          ? <Icon path={mdiYoutube} style={{ verticalAlign: 'middle', color: hexToHSL('#FF0000') }} />
          : <Icon path={mdiTwitch} style={{ verticalAlign: 'middle', color: hexToHSL('#6441A4') }}/>}
      </Box>
    </Box>

    {((message.service === 'twitch' && Array.isArray(message.badges) && message.badges.length > 0)
    // youtube check if there are badges
      || (message.service === 'youtube' && (message.badges.moderator || message.badges.owner || message.badges.subscriber) ))
      && <Box sx={{
        pr: 0.5,
        display: 'inline',
      }}>
        {message.service === 'youtube'
          ? <>
            {message.badges.moderator && <Box key={message.timestamp + message.id + 'moderator'} sx={{
              position:    'relative',
              display:     'inline-block',
              marginRight: '1px',
              width:       `16px`,

            }}>
              <Icon path={mdiWrench} style={{ verticalAlign: 'middle', color: '#4285f4' }} />
            </Box>}

            {message.badges.owner && <Box key={message.timestamp + message.id + 'owner'} sx={{
              position:    'relative',
              display:     'inline-block',
              marginRight: '1px',
              width:       `16px`,

            }}>
              <Icon path={mdiCrown} style={{ verticalAlign: 'middle', color: '#ffd600' }} />
            </Box>}

            {message.badges.subscriber && <Box key={message.timestamp + message.id + 'subscriber'} sx={{
              position:    'relative',
              display:     'inline-block',
              marginRight: '1px',
              width:       `16px`,

            }}>
              <Icon path={mdiDiamond} style={{ verticalAlign: 'middle', color: 'gold' }} />
            </Box>}
          </>
          : message.badges.map(badge => <Box key={message.timestamp + message.id + badge.url} sx={{
            position:    'relative',
            display:     'inline-block',
            marginRight: '1px',
            height:      `10px`,
            width:       `16px`,
          }}>
            <img src={badge.url} style={{
              top:       0,
              bottom:    0,
              position: 'absolute',
              width:      `16px`,
              margin:    'auto',
            }}/>
          </Box>)}
      </Box>}

    <Typography component='span' sx={{
      color: message.color ? hexToHSL(message.color) : generateColorFromString(message.displayName),
      pr: 0.5,
    }}>{ message.displayName }:
    </Typography>

    <span>
      { HTMLReactParser(message.message) }
    </span>
  </Box>;
};

export const DashboardWidgetTwitch: React.FC = () => {
  getSocket('/widgets/chat');
  getSocket('/overlays/chat');

  const { translate } = useTranslation();

  const [value, setValue] = React.useState('1');
  const [timestamp, setTimestamp] = React.useState(Date.now());
  const [room, setRoom] = React.useState('');
  const { isStreamOnline } = useAppSelector(state => state.page);
  const [ unfold, setUnfold ] = useLocalstorageState('chat_unfold', true);
  const [ split, setSplit ] = useLocalstorageState('chat_split', false);
  const [ mergedChat, setMergedChat ] = useLocalstorageState('chat_merged', false);

  const [ messages, setMessages ] = useLocalstorageState<OverlayState['chat']['messages']>('chat_messages', []);

  const [height, setHeight] = React.useState(0);
  const ref = React.createRef<HTMLDivElement>();

  React.useEffect(() => {
    setTimestamp(Date.now());
  }, [ value ]);

  React.useEffect(() => {
    if (isStreamOnline) {
      setTimeout(() => {
        setTimestamp(Date.now());
      }, 60000 * 10);
    }
  }, [ isStreamOnline ]);

  const scrollBarRef = React.useRef(null);

  React.useEffect(() => {
    getSocket('/widgets/chat').emit('room', (err, val) => {
      if (err) {
        return console.error(err);
      }
      setRoom(val);
    });

    getSocket('/overlays/chat').on('message', (data: any) => {
      if (isAlreadyProcessed(data.id)) {
        return;
      }

      setMessages(val => [...val, data]);
      setTimeout(() => {
        if (scrollBarRef.current) {
          const scrollElement = (scrollBarRef.current as any).contentWrapperEl;
          scrollElement.scrollTop = scrollElement.scrollHeight;
        }
      }, 1);
    });

    if (scrollBarRef.current) {
      const scrollElement = (scrollBarRef.current as any).contentWrapperEl;
      scrollElement.scrollTop = scrollElement.scrollHeight;
    }
  }, []);

  useIntervalWhen(() => {
    if (ref.current) {
      const bodyRect = document.body.getBoundingClientRect();
      const elemRect = ref.current.getBoundingClientRect();
      const offset   = elemRect.top - bodyRect.top;
      setHeight(window.innerHeight - offset - 3);
    }
  }, 1000, true, true);

  const videoUrl = React.useMemo(() => {
    return `${window.location.protocol}//player.twitch.tv/?channel=${room}&autoplay=true&muted=true&parent=${window.location.hostname}`;
  }, [room]);

  const chatUrl = React.useMemo(() => {
    return 'https://twitch.tv/embed/'
      + room
      + '/chat'
      + '?darkpopout'
      + '&parent=' + window.location.hostname;
  }, [room]);

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
  };

  React.useEffect(() => {
    // set tab to 1
    setValue('1');

    if (scrollBarRef.current) {
      const scrollElement = (scrollBarRef.current as any).contentWrapperEl;
      scrollElement.scrollTop = scrollElement.scrollHeight;
    }
  }, [split]);

  return (
    <Card variant="outlined" sx={{ height: height + 'px' }} ref={ref}>
      <TabContext value={value}>
        <Box sx={{
          borderBottom:    1,
          borderColor:     'divider',
          backgroundColor: theme.palette.grey[900],
          height:          '48px',
        }}>
          <Box width={'100%'} height={48} sx={{
            display: unfold ? 'flex' : 'none', alignItems: 'center',
          }}>
            <TabList onChange={handleChange} aria-label="lab API tabs example" sx={{ flexGrow: 1 }}>
              <Tab label={split ? `${translate('widget-title-monitor')} / ${translate('widget-title-chat')}` : translate('widget-title-chat')} value="1" />
              <Tab sx={{ display: !split ? 'inherit' : 'none' }}  label={translate('widget-title-monitor')} value="2" />
            </TabList>
            <PopupState variant="popover" popupId="demo-popup-menu">
              {(popupState) => (
                <React.Fragment>
                  <IconButton sx={{ height: '40px' }} {...bindTrigger(popupState)}>
                    <ChatTwoTone/>
                  </IconButton>
                  <Menu {...bindMenu(popupState)}>
                    <MenuItem selected={!mergedChat} onClick={() => {
                      setMergedChat(false); popupState.close();
                    }}>Twitch embed</MenuItem>
                    <MenuItem selected={mergedChat} onClick={() => {
                      setMergedChat(true); popupState.close();
                    }}>Twitch + YouTube</MenuItem>
                  </Menu>
                </React.Fragment>
              )}
            </PopupState>
            <IconButton onClick={() => setSplit(!split)} sx={{ height: '40px' }}>
              <SplitscreenTwoTone/>
            </IconButton>
            <IconButton onClick={() => setUnfold(false)} sx={{ height: '40px' }}>
              <UnfoldLessTwoTone/>
            </IconButton>
          </Box>
          <IconButton onClick={() => setUnfold(true)} sx={{
            display: !unfold ? undefined : 'none', mt: 0.5,
          }}>
            <UnfoldMoreTwoTone/>
          </IconButton>
        </Box>
        <Box sx={{
          position:        'relative',
          height:          'calc(100% - 48px);',
          display:         !unfold ? undefined : 'none',
          textOrientation: 'mixed',
          writingMode:     'vertical-rl',
          margin:          '7px',
        }}>
          <Typography variant='button' sx={{ p: 1 }}>
          Chat / Monitor
          </Typography>
        </Box>
        <Box sx={{
          position: 'relative', height: 'calc(100% - 48px);',
        }}>
          {split ? (<Box sx={{
            height: '100%', width: '100%', display: unfold ? undefined : 'none',
          }}>
            <Stack sx={{ height: '100%' }}>
              <iframe
                frameBorder="0"
                scrolling="no"
                src={videoUrl}
                width="100%"
                height="30%"
              />
              {mergedChat
                ? <SimpleBar ref={scrollBarRef} style={{ maxHeight: '70%', padding: '5px' }} autoHide={false}>
                  <Box>
                    <Divider>Welcome to the merged simple chat!</Divider>
                    {messages
                      .map(message => <SimpleMessage key={message.id} message={message} />)}
                  </Box>
                </SimpleBar>
                : <iframe
                  frameBorder="0"
                  scrolling="no"
                  src={chatUrl}
                  width="100%"
                  height="100%"
                />}
            </Stack>
          </Box>)
            : <><Box sx={{
              ...(value === '1' ? classes.showTab : classes.hideTab), height: '100%', width: '100%', display: unfold ? undefined : 'none',
            }}>
              {mergedChat
                ? <SimpleBar ref={scrollBarRef} style={{ maxHeight: '100%', padding: '5px' }} autoHide={false}>
                  <Box>
                    <Divider>Welcome to the merged simple chat!</Divider>
                    {messages
                      .map(message => <SimpleMessage key={message.id} message={message} />)}
                  </Box>
                </SimpleBar>
                : <iframe
                  frameBorder="0"
                  scrolling="no"
                  src={chatUrl}
                  width="100%"
                  height="100%"
                />}
            </Box>
            <Box key={`twitch-monitor-${timestamp}`} sx={{
              ...(value === '2' ? classes.showTab : classes.hideTab), height: '100%', width: '100%',
            }}>
              <iframe
                frameBorder="0"
                scrolling="no"
                src={videoUrl}
                width="100%"
                height="100%"
              />
            </Box>
            </>}
        </Box>
      </TabContext>
    </Card>
  );
};
