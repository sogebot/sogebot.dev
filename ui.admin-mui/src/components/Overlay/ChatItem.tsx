import {
  Box, Button, Fade, Grow, Typography,
} from '@mui/material';
import { Chat } from '@sogebot/backend/dest/database/entity/overlay';
import { shadowGenerator, textStrokeGenerator } from '@sogebot/ui-helpers/text';
import gsap from 'gsap';
import HTMLReactParser from 'html-react-parser';
import Jabber from 'jabber';
import { cloneDeep, orderBy } from 'lodash';
import React from 'react';
import { useSelector } from 'react-redux';
import { useIntervalWhen } from 'rooks';
import shortid from 'shortid';

import { getSocket } from '../../helpers/socket';
import { loadFont } from '../Accordion/Font';

export type Props<T> = {
  item: T,
  id: string,
  groupId: string,
  /** Overlay is active, e.g. used in overlay */
  active?: boolean,
  /** Selected in editation */
  selected?: boolean,
};

const jabber = new Jabber();

const generateColorFromString = (stringInput: string) => {
  const stringUniqueHash = [...stringInput].reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  return `hsl(${stringUniqueHash % 360}, 80%, 60%)`;
};
export const ChatItem: React.FC<Props<Chat>> = ({ item, active, selected }) => {
  const lang = useSelector((state: any) => state.loader.configuration.lang );

  const [ messages, setMessages ] = React.useState<{ id: string, timestamp: number, userName: string, displayName: string, message: string, show: boolean, badges: {url: string}[] }[]>([]);

  const [ fontSize, setFontSize ] = React.useState<Record<string,number>>({});
  const [ posY, setPosY ] = React.useState<Record<string,number>>({});

  const moveNicoNico = React.useCallback((elementId: string) => {
    const element = document.getElementById(`nico-${elementId}`);
    if (element) {
      gsap.to(element, {
        ease:       'none',
        left:       '-100%',
        marginLeft: '0',
        duration:   Math.max(5, Math.floor(Math.random() * 15)),
        onComplete: () => {
          setMessages(msgs => {
            return msgs.filter(o => o.id !== elementId );
          });
          setPosY(pos => {
            delete pos[elementId];
            return { ...pos };
          });
          setFontSize(pos => {
            delete pos[elementId];
            return { ...pos };
          });
        },
      });
    } else {
      setTimeout(() => moveNicoNico(elementId), 1000);
    }
  }, []);

  React.useEffect(() => {
    getSocket('/overlays/chat', true).on('timeout', (userName) => {
      setMessages(msgs => {
        const update = cloneDeep(msgs);
        for (const msg of update.filter(o => o.userName === userName)) {
          setPosY(pos => {
            delete pos[msg.id];
            return { ...pos };
          });
          setFontSize(pos => {
            delete pos[msg.id];
            return { ...pos };
          });
          msg.show = false;
        }
        return update.filter(o => o.userName !== userName);
      });
    });

    getSocket('/overlays/chat', true).on('message', (data) => {
      setMessages(i => {
        if (!i.find(o => o.id === data.id)) {
          return [...i, data as any];
        } else {
          return i;
        }
      });
      setPosY(o => ({
        ...o, [data.id]: Math.floor(Math.random() * 90),
      }));
      setFontSize(o => ({
        ...o, [data.id]: Math.floor(Math.random() * 30) - 15,
      }));

      if (item.type === 'niconico') {
        moveNicoNico(data.id);
      }
    });
  }, []);

  const test = React. useCallback(async () => {
    // show test messages
    const userName = jabber.createWord(3 + Math.ceil(Math.random() * 20)).toLowerCase();
    const longMessage = Math.random() <= 0.1;
    const emotes = Math.random() <= 1 ? `<span class="simpleChatImage"><img src='https://static-cdn.jtvnw.net/emoticons/v2/25/default/dark/3.0' class="emote" alt="Kappa" title="Kappa"/></span>`.repeat(Math.round(Math.random() * 5)) : '';
    const id = shortid();

    let message = jabber.createParagraph(1 + Math.ceil(Math.random() * (longMessage ? 3 : 10))) + emotes;
    if (lang === 'cs') {
      message = Math.random() <= 0.3 ? 'Příliš žluťoučký kůň úpěl ďábelské ódy.' : message;
    }
    if (lang === 'ru') {
      message = Math.random() <= 0.3 ? 'Эх, чужак, общий съём цен шляп (юфть) – вдрызг!' : message;
    }

    setMessages(i => [...i, {
      id,
      timestamp:   Date.now(),
      userName,
      displayName: Math.random() <= 0.5 ? userName : jabber.createWord(3 + Math.ceil(Math.random() * 20)).toLowerCase(),
      message,
      show:        true,
      badges:      Math.random() <= 0.3 ? [{ url: 'https://static-cdn.jtvnw.net/badges/v1/3267646d-33f0-4b17-b3df-f923a41db1d0/3' }, { url: 'https://static-cdn.jtvnw.net/badges/v1/fc46b10c-5b45-43fd-81ad-d5cb0de6d2f4/3' }] : [],
    }]);

    if (item.type === 'niconico') {
      setPosY(o => ({
        ...o, [id]: Math.floor(Math.random() * 90),
      }));
      setFontSize(o => ({
        ...o, [id]: Math.floor(Math.random() * 30) - 15,
      }));
      moveNicoNico(id);
    }
  }, []);

  useIntervalWhen(() => {
    messages.filter(msg => !msg.show).forEach(msg => {
      setPosY(pos => {
        delete pos[msg.id];
        return { ...pos };
      });
      setFontSize(pos => {
        delete pos[msg.id];
        return { ...pos };
      });
    });

    // check if message should be hidden
    setMessages(i => [...i.map(msg => ({
      ...msg, show: msg.timestamp + item.hideMessageAfter > Date.now(),
    }))]);

    // clear messages 10 seconds after hide
    setMessages(i => [...i.filter(msg => msg.timestamp + item.hideMessageAfter + 10000 > Date.now())]);
  }, 1000, true, true);

  React.useEffect(() => {
    loadFont(item.font.family);

    if (active) {
      console.log(`====== CHAT ======`);
    }
  }, [item]);

  const boxStyle = React.useMemo(() => {
    if (item.type === 'vertical') {
      return item.reverseOrder ? {
        top: '5px', width: '100%',
      } : {
        bottom: '5px', width: '100%',
      };
    }
    if (item.type === 'horizontal') {
      return item.reverseOrder ? {
        display: 'inline-flex !important', width: 'max-content !important', left: 0,
      } : {
        display: 'inline-flex !important', width: 'max-content !important', right: 0,
      };
    }

    return {};
  }, [item]);

  return <>
    <Box sx={{
      width: '100%', height: '100%', overflow: 'hidden', position: 'relative', p: 0.5, textTransform: 'none !important',
    }}>
      {item.type === 'niconico' && messages.map(message => <Fade in={message.show} key={message.timestamp} mountOnEnter unmountOnExit>
        <Box
          id={`nico-${message.id}`}
          sx={{
            position:           'absolute',
            width:              'max-content',
            color:              item.font.color,
            fontFamily:         item.font.family,
            fontWeight:         item.font.weight,
            top:                `${Math.max(1, (posY[message.id] || 0))}%`,
            fontSize:           (Math.max(16, item.font.size + (fontSize[message.id] || 0))) + 'px',
            textShadow:         [textStrokeGenerator(item.font.borderPx, item.font.borderColor), shadowGenerator(item.font.shadow)].filter(Boolean).join(', '),
            lineHeight:         `${item.useCustomLineHeight ? `${item.customLineHeight}px` : `${item.font.size}px`}`,
            marginLeft:         '100%',
            left:               0,
            '.simpleChatImage': {
              position:    'relative',
              display:     'inline-block',
              width:       `${item.useCustomEmoteSize ? item.customEmoteSize : Math.max(16, item.font.size + (fontSize[message.id] || 0)) * 1.1}px`,
              marginRight: '1px',
              marginLeft:  '1px',
            },
            '.simpleChatImage .emote': {
              width:     `${item.useCustomEmoteSize ? item.customEmoteSize : Math.max(16, item.font.size + (fontSize[message.id] || 0)) * 1.1}px`,
              height:    `${item.useCustomEmoteSize ? item.customEmoteSize : Math.max(16, item.font.size + (fontSize[message.id] || 0)) * 1.1}px`,
              position:  'absolute',
              objectFit: 'contain',
              overflow:  'visible',
              top:       0,
              bottom:    0,
              margin:    'auto',
              transform: 'translateY(-30%)',
            },
          }}
        >
          {item.showTimestamp && new Date(message.timestamp).toLocaleTimeString('default', {
            hour: '2-digit', minute: '2-digit',
          })}{' '}
          { HTMLReactParser(message.message) }
        </Box>
      </Fade>)
      }

      {item.type !== 'niconico' && <Box sx={{
        fontSize:      `${item.font.size}px`,
        lineHeight:    `${item.useCustomLineHeight ? `${item.customLineHeight}px` : `${item.font.size}px`}`,
        color:         `${item.font.color}`,
        fontFamily:    item.font.family,
        fontWeight:    item.font.weight,
        textShadow:    [textStrokeGenerator(item.font.borderPx, item.font.borderColor), shadowGenerator(item.font.shadow)].filter(Boolean).join(', '),
        textAlign:     'left',
        textTransform: 'none',
        position:      'absolute',
        ...boxStyle,
      }}>
        {orderBy(messages, 'timestamp', item.reverseOrder ? 'desc' :'asc')
          .map(message => <Fade in={message.show} key={message.timestamp} mountOnEnter unmountOnExit>
            <Box sx={{
              pb:                 item.useCustomSpaceBetweenMessages ? `${item.customSpaceBetweenMessages}px` : 0.2,
              pr:                 item.useCustomSpaceBetweenMessages ? `${item.customSpaceBetweenMessages}px` : 1,
              lineHeight:         `${item.useCustomLineHeight ? `${item.customLineHeight}px` : `${item.font.size}px`}`,
              '.simpleChatImage': {
                position:    'relative',
                display:     'inline-block',
                width:       `${item.useCustomEmoteSize ? item.customEmoteSize : item.font.size * 1.1}px`,
                marginRight: '1px',
                marginLeft:  '1px',
              },
              '.simpleChatImage .emote': {
                width:     `${item.useCustomEmoteSize ? item.customEmoteSize : item.font.size * 1.1}px`,
                height:    `${item.useCustomEmoteSize ? item.customEmoteSize : item.font.size * 1.1}px`,
                position:  'absolute',
                objectFit: 'contain',
                overflow:  'visible',
                top:       0,
                bottom:    0,
                margin:    'auto',
                transform: 'translateY(-30%)',
              },
            }}>
              {item.showTimestamp && <Typography component='span' sx={{
                pr:         0.5,
                fontSize:   `${item.font.size}px`,
                lineHeight: `${item.useCustomLineHeight ? `${item.customLineHeight}px` : `${item.font.size}px`}`,
              }}>{new Date(message.timestamp).toLocaleTimeString('default', {
                  hour: '2-digit', minute: '2-digit',
                })}</Typography>}

              {item.showBadges && message.badges.length > 0 && <Box sx={{
                pr: 0.5, display: 'inline',
              }}>
                {message.badges.map(badge => <Box key={message.timestamp + message.id + badge.url} sx={{
                  position:    'relative',
                  display:     'inline-block',
                  marginRight: '1px',
                  width:       `${item.useCustomBadgeSize ? item.customBadgeSize : item.font.size}px`,
                }}>
                  <img src={badge.url} style={{
                    width:     `${item.useCustomBadgeSize ? item.customBadgeSize : item.font.size}px`,
                    height:    `${item.useCustomBadgeSize ? item.customBadgeSize : item.font.size}px`,
                    position:  'absolute',
                    objectFit: 'contain',
                    overflow:  'visible',
                    top:       0,
                    bottom:    0,
                    margin:    'auto',
                    transform: 'translateY(-30%)',
                  }}/>
                </Box>)}
              </Box>}
              <Typography component='strong' sx={{
                fontFamily: item.font.family,
                pr:         0.5,
                color:      generateColorFromString(message.displayName),
                fontWeight: item.font.weight,
                fontSize:   `${item.font.size}px`,
                lineHeight: `${item.useCustomLineHeight ? `${item.customLineHeight}px` : `${item.font.size}px`}`,
              }}>
                { message.displayName }:
              </Typography>
              { HTMLReactParser(message.message) }
            </Box>
          </Fade>)}
      </Box>}
    </Box>

    <Grow in={selected} unmountOnExit mountOnEnter>
      <Box sx={{
        position: 'absolute', top: `-35px`, fontSize: '10px', textAlign: 'left', left: 0,
      }}>
        <Button size='small' onClick={test} variant='contained'>Test</Button>
      </Box>
    </Grow>
  </>;
};