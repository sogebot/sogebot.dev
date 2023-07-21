import {
  Box, Fade, Typography,
} from '@mui/material';
import { Chat } from '@sogebot/backend/dest/database/entity/overlay';
import { shadowGenerator, textStrokeGenerator } from '@sogebot/ui-helpers/text';
import gsap from 'gsap';
import HTMLReactParser from 'html-react-parser';
import { orderBy } from 'lodash';
import React from 'react';
import { useIntervalWhen } from 'rooks';

import { getSocket } from '../../helpers/socket';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import {
  chatAddMessage, chatRemoveMessageById, chatTimeout, cleanMessages,
} from '../../store/overlaySlice';
import { loadFont } from '../Accordion/Font';

export type Props<T> = {
  item: T,
  id: string,
  groupId: string,
  /** Overlay is active, e.g. used in overlay */
  active?: boolean,
  /** Selected in editation */
  selected?: boolean,
  width: number,
  height: number,
};

const generateColorFromString = (stringInput: string) => {
  const stringUniqueHash = [...stringInput].reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  return `hsl(${stringUniqueHash % 360}, 80%, 60%)`;
};
export const ChatItem: React.FC<Props<Chat>> = ({ item, active }) => {
  const messages = useAppSelector(state => state.overlay.chat.messages);
  const posY = useAppSelector(state => state.overlay.chat.posY);
  const fontSize = useAppSelector(state => state.overlay.chat.fontSize);
  const dispatch = useAppDispatch();

  const moveNicoNico = React.useCallback((elementId: string) => {
    const element = document.getElementById(`nico-${elementId}`);
    if (element) {
      gsap.to(element, {
        ease:       'none',
        left:       '-100%',
        marginLeft: '0',
        duration:   Math.max(5, Math.floor(Math.random() * 15)),
        onComplete: () => {
          dispatch(chatRemoveMessageById(elementId));
        },
      });
    } else {
      setTimeout(() => moveNicoNico(elementId), 1000);
    }
  }, []);

  React.useEffect(() => {
    getSocket('/overlays/chat', true).on('timeout', userName => {
      dispatch(chatTimeout(userName));
    });

    getSocket('/overlays/chat', true).on('message', (data: any) => {
      if (data.message.startsWith('!') && !item.showCommandMessages) {
        return;
      }
      dispatch(chatAddMessage(data));

      if (item.type === 'niconico') {
        moveNicoNico(data.id);
      }
    });
  }, [ item, dispatch ]);

  useIntervalWhen(() => {
    if (item.type !== 'niconico') {
      dispatch(cleanMessages(item.hideMessageAfter));
    }
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
  </>;
};
