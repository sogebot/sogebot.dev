import { Box, Fade, Typography } from '@mui/material';
import { Chat } from '@sogebot/backend/dest/database/entity/overlay';
import { shadowGenerator, textStrokeGenerator } from '@sogebot/ui-helpers/text';
import gsap from 'gsap';
import HTMLReactParser from 'html-react-parser';
import { orderBy } from 'lodash';
import React from 'react';
import { useIntervalWhen } from 'rooks';

import { isAlreadyProcessed } from './_processedSocketCalls';
import { getSocket } from '../../helpers/socket';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { chatAddMessage, chatRemoveMessageById, chatTimeout, cleanMessages } from '../../store/overlaySlice';
import { loadFont } from '../Accordion/Font';

export type Props<T> = {
  item:      T,
  id:        string,
  groupId:   string,
  /** Overlay is active, e.g. used in overlay */
  active?:   boolean,
  /** Selected in editation */
  selected?: boolean,
  width:     number,
  height:    number,
};

const generateColorFromString = (stringInput: string) => {
  const stringUniqueHash = [...stringInput].reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  return `hsl(${stringUniqueHash % 360}, 80%, 60%)`;
};

function hexToHSL(hexColor: string) {
  // Remove the '#' symbol if present
  hexColor = hexColor.replace(/^#/, '');

  // Convert the HEX color to RGB
  const r = parseInt(hexColor.slice(0, 2), 16) / 255;
  const g = parseInt(hexColor.slice(2, 4), 16) / 255;
  const b = parseInt(hexColor.slice(4, 6), 16) / 255;

  // Calculate the maximum and minimum values for RGB
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);

  // Calculate the lightness
  const lightness = (max + min) / 2 * 100;

  // Calculate the saturation
  let saturation = 0;

  if (max !== min) {
    const delta = max - min;
    saturation = lightness > 50 ? delta / (2 - max - min) : delta / (max + min);
  }

  // Calculate the hue
  let hue = 0;

  if (max === r) {
    hue = ((g - b) / (max - min)) * 60;
  } else if (max === g) {
    hue = (2 + (b - r) / (max - min)) * 60;
  } else if (max === b) {
    hue = (4 + (r - g) / (max - min)) * 60;
  }

  if (hue < 0) {
    hue += 360;
  }

  return `hsl(${hue}, ${saturation * 100}%, ${Math.max(70, lightness)}%)`;
}

export const ChatItem: React.FC<Props<Chat>> = ({ item, active, height }) => {
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
      if (isAlreadyProcessed(data.id)) {
        return;
      }
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

  const orderedMessages = React.useMemo(() => {
    return orderBy(messages, 'timestamp', item.reverseOrder ? 'desc' :'asc');
  }, [ messages, item.reverseOrder ]);

  React.useEffect(() => {
    // we need to wait little bit for the messages to be rendered
    setTimeout(() => {
      const elements = document.getElementsByClassName('message');
      if (item.type === 'vertical') {
        const toHide: string[] = [];

        if (item.reverseOrder) {
        // reverse order goes from top to bottom, we want to hide elements that are below the height
          let parent: number | null = null;
          for (const el of elements) {
            if (!parent) {
              parent = (el.parentElement?.getBoundingClientRect().top ?? 0) + height;
            }

            if (parent) {
              if (parent - el.getBoundingClientRect().bottom < 0) {
                toHide.push(el.id);
              }
            }
          }
        } else {
          let parent: number | null = null;
          for (const el of elements) {
            if (!parent) {
              parent = (el.parentElement?.getBoundingClientRect().bottom ?? 0) - height;
            }

            if (parent) {
              if (parent - el.getBoundingClientRect().top > 0) {
                toHide.push(el.id);
              }
            }
          }

        }
        Array.from<HTMLElement>(elements as any).forEach(el => {
          const message = messages.find(o => o.id === el.id);
          if (!message) {
            return;
          }
          if (message.show && !toHide.includes(el.id)) {
            el.style.opacity = '1';
          } else {
            el.style.opacity = '0';
          }
        });
      } else {
        Array.from<HTMLElement>(elements as any).forEach(el => el.style.opacity = '1');
      }
    }), 10;
  }, [ messages, item.reverseOrder, height ]);

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
      width: '100%', height: '100%', overflow: 'hidden', position: 'relative', textTransform: 'none !important',
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
        {orderedMessages
          .map(message => <Box className="message" id={message.id} key={message.id} sx={{
            transition: 'all 0.5s ease-in-out',
            opacity:    0,
            // opacity:    message.show && !hideMessagesByBoundaries.includes(message.id) ? 1 : 0,
            p:          `${item.messagePadding}px`,
            mt:         item.type === 'vertical' && !item.reverseOrder
              ? item.useCustomSpaceBetweenMessages ? `${item.customSpaceBetweenMessages}px` : 0
              : 0,
            mb: item.type === 'vertical' && item.reverseOrder
              ? item.useCustomSpaceBetweenMessages ? `${item.customSpaceBetweenMessages}px` : 0
              : 0,
            mr: item.type === 'horizontal'
              ? item.useCustomSpaceBetweenMessages ? `${item.customSpaceBetweenMessages}px` : 0
              : 0,
            backgroundColor:    item.messageBackgroundColor,
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
            <Typography component='span' sx={{
              fontSize:   `${item.font.size}px`,
              lineHeight: `${item.useCustomLineHeight ? `${item.customLineHeight}px` : `${item.font.size}px`}`,
              fontFamily: item.font.family,
              fontWeight: item.font.weight,
              textShadow: [textStrokeGenerator(item.font.borderPx, item.font.borderColor), shadowGenerator(item.font.shadow)].filter(Boolean).join(', '),
              color:      item.useGeneratedColors || !message.color ? generateColorFromString(message.displayName) : hexToHSL(message.color),
              ...(item.usernameFont
                ? {
                  fontSize:   `${item.usernameFont.size}px`,
                  fontFamily: item.usernameFont.family,
                  fontWeight: item.usernameFont.weight,
                  textShadow: [textStrokeGenerator(item.usernameFont.borderPx, item.usernameFont.borderColor), shadowGenerator(item.usernameFont.shadow)].filter(Boolean).join(', '),
                  ...(item.useCustomUsernameColor && {
                    color: `${item.usernameFont.color}`,
                  })
                }
                : {}),
            }}>
              { message.displayName }
            </Typography>
            <Typography component='span' sx={{
              fontSize:   `${item.font.size}px`,
              lineHeight: `${item.useCustomLineHeight ? `${item.customLineHeight}px` : `${item.font.size}px`}`,
              fontFamily: item.font.family,
              fontWeight: item.font.weight,
              textShadow: [textStrokeGenerator(item.font.borderPx, item.font.borderColor), shadowGenerator(item.font.shadow)].filter(Boolean).join(', '),
              color:      item.useGeneratedColors || !message.color ? generateColorFromString(message.displayName) : hexToHSL(message.color),
              ...(item.usernameFont
                ? {
                  ...(item.useCustomUsernameColor && {
                    color: `${item.usernameFont.color}`,
                  })
                }
                : {}),
              ...(item.separatorFont
                ? {
                  fontSize:   `${item.separatorFont.size}px`,
                  color:      `${item.separatorFont.color}`,
                  fontFamily: item.separatorFont.family,
                  fontWeight: item.separatorFont.weight,
                  textShadow: [textStrokeGenerator(item.separatorFont.borderPx, item.separatorFont.borderColor), shadowGenerator(item.separatorFont.shadow)].filter(Boolean).join(', '),
                }
                : {}),
            }}>
              { item.separator }
            </Typography>
            <span>
              { HTMLReactParser(message.message) }
            </span>
          </Box>)}
      </Box>}
    </Box>
  </>;
};
