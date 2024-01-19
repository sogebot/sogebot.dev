import { mdiCrown, mdiDiamond, mdiTwitch, mdiWrench, mdiYoutube } from '@mdi/js';
import Icon from '@mdi/react';
import { ChatTwoTone, NotificationsActiveTwoTone, NotificationsOffTwoTone, SplitscreenTwoTone, UnfoldLessTwoTone, UnfoldMoreTwoTone } from '@mui/icons-material';
import { TabContext, TabList } from '@mui/lab';
import { Alert, Box, Button, Card, Divider, IconButton, Menu, MenuItem, Paper, Popover, Slider, Stack, Tab, Typography } from '@mui/material';
import HTMLReactParser from 'html-react-parser';
import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai';
import PopupState, { bindMenu, bindPopover, bindTrigger } from 'material-ui-popup-state';
import React from 'react';
import usePortal from 'react-useportal';
import { useIntervalWhen, useLocalstorageState } from 'rooks';
import SimpleBar from 'simplebar-react';

import notifAudio from './assets/message-notification.mp3';
import { DAY, HOUR, MINUTE } from '../../../constants';
import { dayjs } from '../../../helpers/dayjsHelper';
import { getSocket } from '../../../helpers/socket';
import { useAppSelector } from '../../../hooks/useAppDispatch';
import { useTranslation } from '../../../hooks/useTranslation';
import { OverlayState } from '../../../store/overlaySlice';
import theme from '../../../theme';
import { FormInputTime } from '../../Form/Input/Time';
import { isAlreadyProcessed } from '../../Overlay/_processedSocketCalls';
import { generateColorFromString, hexToHSL } from '../../Overlay/ChatItem';
import { classes } from '../../styles';

const anBanMenuForId = atom<null | string>(null);
const anBanMenuPositionY = atom(0);
const anBanMenuPositionX = atom(0);
const anIsScrollBlocked = atom(false);

let mouseOverBanMenu = false;

const firstHalfBanTimes = [
  ...Array.from({ length: 13 }).map((_, index) => ({ title: `${13 - index} day(s)`, value: (13 - index) * DAY })),
  ...Array.from({ length: 23 }).map((_, index) => ({ title: `${23 - index} hour(s)`, value: (23 - index) * HOUR })),
].reverse();
const secondHalfBanTimes = [
  ...Array.from({ length: 59 }).map((_, index) => ({ title: `${59 - index} minutes(s)`, value: (59 - index) * MINUTE })),
].reverse();

const isSystemMessage = (service?: string) => {
  return service === '@stream-started';
};

const SystemMessage = ({ message } : { message: OverlayState['chat']['messages'][0] }) => {
  if (message.service === '@stream-started') {
    return <Divider key={message.id} sx={{ color: theme.palette.grey[600] }}>Stream started at {dayjs(message.timestamp).format('LLL')}</Divider>;
  } else {
    return <Divider key={message.id} sx={{ color: theme.palette.grey[600] }}>Unknown system message</Divider>;
  }
};

const SimpleMessage = ({ message, isBanned }: { message: OverlayState['chat']['messages'][0], isBanned: boolean }) => {
  const setBanMenuForId = useSetAtom(anBanMenuForId);
  const setBanMenuPosition = useSetAtom(anBanMenuPositionY);
  const setBanMenuPositionX = useSetAtom(anBanMenuPositionX);

  return <Box id={message.id} data-username={message.userName} key={message.id} onContextMenu={(ev) => {
    if (!isBanned) {
      setBanMenuForId(message.id);
      setBanMenuPosition(ev.clientY - 85);
      setBanMenuPositionX(ev.clientX + 10);
    }
    ev.preventDefault();
  }}
  sx={{
    opacity: isBanned ? 0.35 : undefined,
    cursor: isBanned ? 'not-allowed' : 'help',
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
      pr: 0.5,
      display: 'inline',
    }}>
      <Box key={message.timestamp + message.id} sx={{
        position:    'relative',
        display:     'inline-block',
        marginRight: '1px',
        width:       `16px`,
        verticalAlign: 'text-bottom',
        transform: 'translateY(2px)',

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
            {!message.badges.moderator && <Box key={message.timestamp + message.id + 'moderator'} sx={{
              position:    'relative',
              display:     'inline-block',
              marginRight: '1px',
              width:       `16px`,
              transform:   'translateY(-2px)',

            }}>
              <Icon path={mdiWrench} style={{ verticalAlign: 'middle', color: '#4285f4', height: '14px', marginLeft: '1px' }} />
            </Box>}

            {message.badges.owner && <Box key={message.timestamp + message.id + 'owner'} sx={{
              position:    'relative',
              display:     'inline-block',
              marginRight: '1px',
              width:       `16px`,
              transform:   'translateY(-2px)',

            }}>
              <Icon path={mdiCrown} style={{ verticalAlign: 'middle', color: '#ffd600' }} />
            </Box>}

            {message.badges.subscriber && <Box key={message.timestamp + message.id + 'subscriber'} sx={{
              position:    'relative',
              display:     'inline-block',
              marginRight: '1px',
              width:       `16px`,
              transform:   'translateY(-2px)',
            }}>
              <Icon path={mdiDiamond} style={{ verticalAlign: 'middle', color: 'gold', height: '14px', marginLeft: '1px' }} />
            </Box>}
          </>
          : message.badges.map(badge => <Box key={message.timestamp + message.id + badge.url} sx={{
            position:    'relative',
            display:     'inline-block',
            marginRight: '1px',
            height:      `10px`,
            width:       `16px`,
          }}>
            <img src={badge.url} title="badge" style={{
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

const Chat = ({ scrollBarRef, chatUrl, messages, split, bannedMessages }: { scrollBarRef: React.MutableRefObject<null>, chatUrl: string, messages: OverlayState['chat']['messages'], split: boolean, bannedMessages: string[] }) => {
  const { Portal } = usePortal();
  const [ banMenuForId, setBanMenuForId ] = useAtom(anBanMenuForId);
  const [ isScrollBlocked, setIsScrollBlocked ] = useAtom(anIsScrollBlocked);
  const banMenuPosition = useAtomValue(anBanMenuPositionY);
  const banMenuPositionX = useAtomValue(anBanMenuPositionX);
  const [ mergedChat ] = useLocalstorageState(`${localStorage.server}::chat_merged`, false);

  return <>
    {banMenuForId && <Portal><Paper id="ban-paper" sx={{
      backgroundColor: theme.palette.grey[900] + 'dd',
      border: `1px solid ${theme.palette.grey[900]}`,
      position: 'absolute',
      top: `${banMenuPosition}px`,
      left: `${banMenuPositionX}px`,
      marginLeft: 'auto',
      width: '100px',
      zIndex: 9999,
      userSelect: 'none',
    }}
    onClick={(ev) => ev.stopPropagation()}
    onMouseOver={() => {
      mouseOverBanMenu = true;
    }}
    onMouseLeave={() => {
      mouseOverBanMenu = false;
    }}
    onMouseMove={(ev) => {
      if (mouseOverBanMenu) {
        // calculate mouse position
        const banPaper = document.getElementById('ban-paper');
        const banLine = document.getElementById('ban-line');

        if (!banPaper || !banLine) {
          return;
        }

        const offsetTop = banPaper.getBoundingClientRect().top;
        const max = banPaper.getBoundingClientRect().height;
        const position = (max - (ev.clientY - offsetTop)) / max;
        const result = Math.min(ev.clientY - offsetTop, max - 4);
        banLine.style.top = result + 'px';

        const banText = document.getElementById('ban-text');
        if (position < 0.23) {
          banText!.innerText = 'delete';
        } else if (position > 0.83) {
          banText!.innerText = '!autoban';
        } else if (position > 0.7) {
          banText!.innerText = 'ban';
        } else {
          if (position < 0.5) {
            const perIndex = (0.5 - 0.23) / secondHalfBanTimes.length;
            const selectedIndex = Math.floor((position - 0.23) / perIndex);
            banText!.innerText = secondHalfBanTimes[selectedIndex].title;
          } else {
            const perIndex = (0.7 - 0.5) / firstHalfBanTimes.length;
            const selectedIndex = Math.floor((position - 0.5) / perIndex);
            banText!.innerText = firstHalfBanTimes[selectedIndex].title;
          }
        }
      }
    }}
    onMouseUp={() => {
      let banText = document.getElementById('ban-text')?.innerText;

      if ((banText ?? '').length > 0) {
        const messageEl = document.getElementById(banMenuForId);
        const username = messageEl?.dataset.username ?? '';
        banText = banText?.toLowerCase();
        if (banText === 'delete' || banText === 'ban' || banText === '!autoban') {
          getSocket('/widgets/chat').emit('moderation', { username, type: banText.replace('!', '') as any, messageId: banMenuForId });
        } else {
          const timeout = [...firstHalfBanTimes, ...secondHalfBanTimes].find(val => val.title.toLowerCase() === banText?.toLowerCase())?.value;
          getSocket('/widgets/chat').emit('moderation', { username, type: 'timeout', messageId: banMenuForId, timeout });
        }
      }

      setBanMenuForId(null);
      console.log('Mouse up, should proceed');
    }}
    >
      <Divider sx={{ position: 'absolute', width: '100%', top: '50%' }} id="ban-line"/>
      <Box sx={{ width: '100%', textAlign: 'center', p: 1 }}>
        <Typography variant='button' component='div'>!autoban</Typography>
        <Typography variant='button' component='div'>Ban</Typography>
        <Box sx={{ height: '100px', position: 'relative' }}>
          <Typography variant='button' id="ban-text" sx={{
            position: 'absolute',
            top: '50%',
            width: '100px',
            left: '-9px',
            backgroundColor: '#101010aa',
            transform: 'translateY(-50%)' }}>
          </Typography>
        </Box>
        <Typography variant='button' component='div'>Delete</Typography>
      </Box>
    </Paper></Portal>}

    {isScrollBlocked && <Alert severity='info'
      onClick={() => setIsScrollBlocked(false)}
      sx={{
        cursor: 'pointer',
        position: 'absolute',
        top: split ? 'calc(30%)' : '0px',
        zIndex: 999,
        opacity: 0.9,
        border: '1px solid ' + theme.palette.info.main,
        marginLeft: '50%',
        left: 0,
        width: '100%',
        transform: 'translateX(-50%)',
      }}>
                Auto-scrolling disabled. Click to enable.
    </Alert>}

    {mergedChat
      ? <SimpleBar ref={scrollBarRef} style={{ maxHeight: split ? '70%' : '100%', padding: '5px' }} autoHide={false} onWheel={() => {
        setTimeout(() => {
          const scrollElement = (scrollBarRef.current as any).contentWrapperEl;

          const isBottomReached = (scrollElement.scrollHeight - Math.round(scrollElement.scrollTop) === scrollElement.clientHeight);
          if (isBottomReached) {
            setIsScrollBlocked(false);
          } else {
            setIsScrollBlocked(true);
          }
        }, 50);
      }}>
        <Box>
          <Typography sx={{ color: theme.palette.grey[600] }}>Welcome to the merged simple chat!</Typography>
          {messages
            .map(message => isSystemMessage(message.service)
              ? <SystemMessage message={message}/>
              : <SimpleMessage isBanned={bannedMessages.includes(message.id)} key={message.id} message={message} />
            )}
        </Box>
      </SimpleBar>
      : <iframe
        frameBorder="0"
        scrolling="no"
        src={chatUrl}
        width="100%"
        height="100%"
      />}
  </>;
};

export const DashboardWidgetTwitch: React.FC = () => {
  const { translate } = useTranslation();

  const [ , setBanMenuForId ] = useAtom(anBanMenuForId);

  const [value, setValue] = React.useState('1');
  const [timestamp, setTimestamp] = React.useState(Date.now());
  const [room, setRoom] = React.useState('');
  const { isStreamOnline } = useAppSelector(state => state.page);
  const [ unfold, setUnfold ] = useLocalstorageState(`${localStorage.server}::chat_unfold`, true);
  const [ split, setSplit ] = useLocalstorageState(`${localStorage.server}::chat_split`, false);
  const [ alert, setAlert ] = useLocalstorageState(`${localStorage.server}::chat_alert`, {
    enabled: false,
    volume: 0.5,
    timeBetweenMessages: 60000, /* minute */
  });
  const alertRef = React.useRef(alert);
  React.useEffect(() => {
    alertRef.current = alert;
  }, [ alert ]);

  const [ mergedChat, setMergedChat ] = useLocalstorageState(`${localStorage.server}::chat_merged`, false);
  const [ isScrollBlocked ] = useAtom(anIsScrollBlocked);

  const [ messages, setMessages ] = useLocalstorageState<OverlayState['chat']['messages']>(`${localStorage.server}::chat_messages`, []);
  const messagesRef = React.useRef(messages);
  React.useEffect(() => {
    messagesRef.current = messages;
  }, [ messages ]);
  const [ bannedMessages, setBannedMessages ] = useLocalstorageState(`${localStorage.server}::chat_bannedmessages`, [] as string[]);

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

    getSocket('/widgets/chat').on('message-removed' as any, (data: any) => {
      if (isAlreadyProcessed(data.id)) {
        return;
      }

      setBannedMessages(val => [...val, data.msgId]);
    });

    getSocket('/widgets/chat').on('ban' as any, (data: any) => {
      if (isAlreadyProcessed(data.id)) {
        return;
      }

      const userName = data.userName;
      console.log('Removing messages from user', userName);
      // get All messges from messagesRef
      const messagesToBan = messagesRef.current.filter(val => val.userName === userName).map(o => o.id);
      setBannedMessages(val => [...val, ...messagesToBan]);
    });

    getSocket('/widgets/chat').on('bot-message' as any, (data: any) => {
      if (isAlreadyProcessed(data.id)) {
        return;
      }

      setMessages(val => [...val, data]);
    });

    getSocket('/overlays/chat').on('message', (data: any) => {
      if (isAlreadyProcessed(data.id)) {
        return;
      }

      // check
      setMessages(val => {
        if (!data.service.startsWith('@')) {
          // ignore message from bot
          if (!data.isBot) {
            const lastMessage = val[val.length - 1];
            // play sound if its first chat message or if its been a while
            const diff = data.timestamp - (lastMessage ? lastMessage.timestamp : 0);
            if (diff >= alertRef.current.timeBetweenMessages) {
              if (alertRef.current.enabled) {
                const audio = new Audio(notifAudio);
                audio.volume = alertRef.current.volume;
                audio.play();
              }
            }
          }
        }

        // keep only 1000 messages
        if (val.length > 1000) {
          val.shift();
        }
        return [...val, data];
      });
    });
  }, []);

  useIntervalWhen(() => {
    if (ref.current) {
      const bodyRect = document.body.getBoundingClientRect();
      const elemRect = ref.current.getBoundingClientRect();
      const offset   = elemRect.top - bodyRect.top;
      setHeight(window.innerHeight - offset - 3);
    }
  }, 1000, true, true);

  useIntervalWhen(() => {
    if (scrollBarRef.current) {
      const scrollElement = (scrollBarRef.current as any).contentWrapperEl;
      // move scrollbar down if not blocked
      if (!isScrollBlocked) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, 100, true, true);

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
    <Card variant="outlined" sx={{ height: height + 'px' }} ref={ref} onClick={() => {
      setBanMenuForId(null);
    }}>
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

            <PopupState variant="popover" popupId="demo-popup-menu">
              {(popupState) => (
                <React.Fragment>
                  <IconButton sx={{ height: '40px' }} {...bindTrigger(popupState)}>
                    {alert.enabled ? <NotificationsActiveTwoTone/> : <NotificationsOffTwoTone/>}
                  </IconButton>
                  <Popover {...bindPopover(popupState)}
                    anchorOrigin={{
                      vertical:   'bottom',
                      horizontal: 'center',
                    }}
                    transformOrigin={{
                      vertical:   'top',
                      horizontal: 'center',
                    }}>
                    <Paper sx={{ p: 1 }}>
                      <FormInputTime
                        label='Minimal time between messages'
                        variant="filled"
                        value={alert.timeBetweenMessages}
                        onChange={(newValue) => setAlert(val => ({ ...val, timeBetweenMessages: newValue }))}
                      />
                      <Stack direction='row' spacing={2} alignItems="center" sx={{ pt: 3, pb: 0.5 }}>
                        <Slider
                          step={0.1}
                          min={0}
                          max={1}
                          valueLabelFormat={(val) => `${ translate('registry.alerts.volume') } ${(Number(val * 100).toFixed(0))}%`}
                          valueLabelDisplay="on"
                          value={alert.volume}
                          onChange={(_, newValue) => setAlert(val => ({
                            ...val,
                            volume: newValue as number,
                          }))}/>
                      </Stack>

                      <Stack>
                        <Button variant='contained' color={'dark'} onClick={() => {
                          const audio = new Audio(notifAudio);
                          audio.volume = alert.volume;
                          audio.play();
                        }} sx={{ minWidth: '200px', width: '100%', m:0 }}>
                        Test
                        </Button>
                        <Button variant='contained' color={!alert.enabled ? 'success' : 'error'} onClick={() => {
                          setAlert(val => ({ ...val, enabled: !val.enabled }));
                        }} sx={{ minWidth: '200px', width: '100%', m:0 }}>
                          {alert.enabled ? 'Disable' : 'Enable'}
                        </Button>
                      </Stack>
                    </Paper>
                  </Popover>
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
            <Stack sx={{ height: '100%', position: 'relative' }}>
              <iframe
                frameBorder="0"
                scrolling="no"
                src={videoUrl}
                width="100%"
                height="30%"
              />

              <Chat scrollBarRef={scrollBarRef} chatUrl={chatUrl} messages={messages} bannedMessages={bannedMessages} split={split}/>
            </Stack>
          </Box>)
            : <><Box sx={{
              ...(value === '1' ? classes.showTab : classes.hideTab), height: '100%', width: '100%', display: unfold ? undefined : 'none',
            }}>
              {mergedChat
                ? <Chat scrollBarRef={scrollBarRef} chatUrl={chatUrl} messages={messages} bannedMessages={bannedMessages} split={split}/>
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
