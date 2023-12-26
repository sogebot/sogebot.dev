import { Box } from '@mui/material';
import { generateUsername } from '@sogebot/backend/dest/helpers/generateUsername';
import { Alerts, AlertText } from '@sogebot/backend/src/database/entity/overlay';
import baffle from 'baffle';
import { useAtomValue } from 'jotai';
import { get } from 'lodash';
import { nanoid } from 'nanoid';
import React from 'react';
import { Typewriter } from 'react-simple-typewriter';
import reactStringReplace from 'react-string-replace';
import { useIntervalWhen } from 'rooks';

import { anEmitData } from './AlertItem/atom';
import type { Props } from './ChatItem';
import { shadowGenerator, textStrokeGenerator } from '../../helpers/text';
import { speedOptions } from '../Form/Overlay/AlertSettings/Accordion/AnimationText';

require('animate.css');

import '../../styles/animations.css';

const encodeFont = (font: string) => {
  return `'${font}'`;
};

const regexp = new RegExp(/\*(?<text>.*?)\*/g);
const emotesCache = sessionStorage.getItem('emotes::cache') ? JSON.parse(sessionStorage.getItem('emotes::cache')!) : [];

export const AlertItemText: React.FC<Props<AlertText> & {
  test?: boolean; parent: Alerts, variant: Omit<Alerts['items'][number], 'variants'>,
  canvas: { width: number, height: number }
}>
= ({ item, width, height, parent, variant, active, test, groupId }) => {
  const [ curIdx, setCurIdx ] = React.useState(0);

  const emitData = useAtomValue(anEmitData);
  useIntervalWhen(() => {
    if (item.messageTemplate.split('|')[curIdx + 1]) {
      setCurIdx((idx) => idx + 1);
    } else {
      // do nothing, we reached end of the message
    }
  }, variant.alertDuration / item.messageTemplate.split('|').length);

  const text = React.useMemo<React.ReactNode[]>(() => {
    let template = item.messageTemplate.split('|')[curIdx];

    if (emitData) {
      console.log(`alert-${groupId}-AlertItemText`, '= Replacing values');
      if (test) {
        template = template
          .replace(/\{name\}/g, generateUsername())
          .replace(/\{game\}/g, generateUsername())
          .replace(/\{recipient\}/g, generateUsername())
          .replace(/\{amount\}/g, '100')
          .replace(/\{monthsName\}/g, 'months')
          .replace(/\{currency\}/g, 'USD')
          .replace(/\{message\}/g, 'Lorem Ipsum Dolor Sit Amet');
      } else {
        const data = emitData[groupId];
        template = template
          .replace(/\{name\}/g, data?.name || '')
          .replace(/\{game\}/g, data?.game || '')
          .replace(/\{recipient\}/g, data?.recipient || '')
          .replace(/\{amount\}/g, String(data?.amount))
          .replace(/\{monthsName\}/g, String(data?.monthsName))
          .replace(/\{currency\}/g, String(data?.currency))
          .replace(/\{message\}/g, String(data?.message));
      }
    }

    let replacedText: React.ReactNode[] = [];

    [...template.matchAll(regexp)].forEach((match, idx) => {
      let animatedText: React.JSX.Element[] = [];
      if (variant.animationText === 'baffle') {
        const baffleId = nanoid();
        animatedText = [<span className={`obfuscate-${baffleId}`}>{match[1]}</span>];
        setTimeout(() => {
          baffle('.obfuscate-' + baffleId, {
            characters: variant.animationTextOptions.characters,
            speed:      ((speedOptions.length - speedOptions.findIndex(v => v === variant.animationTextOptions.speed)) * 50),
          }).start().reveal(variant.animationTextOptions.maxTimeToDecrypt, variant.animationTextOptions.maxTimeToDecrypt);
        }, 200);
      } else if (variant.animationText === 'typewriter') {
        // empty word to make sure that delay is used
        animatedText = [<Typewriter words={['', match[1]]} loop={1} cursor cursorStyle='_' delaySpeed={idx * 1000}/>];
      } else {
        animatedText = match[1].split('').map((char, index) => <div
          key={`${char}-${index}`}
          className={`animate__animated animate__infinite animate__${variant.animationText}  animate__${variant.animationTextOptions.speed}`}
          style={{
            animationDelay: (index * 50) + 'ms',
            display:        'inline-block',
          }}>
          { char === ' ' ? <Box sx={{ pr: '0.25em' }}/> : char }
        </div>);
      }

      replacedText = reactStringReplace(replacedText.length === 0 ? template : replacedText, match[0], () => <span style={{ color: item.font ? item.font.highlightcolor : parent[item.globalFont].highlightcolor }}>{animatedText}</span>);
    });

    const output = replacedText.length > 0 ? replacedText : [<span>{template}</span>];

    console.log('============ Replacing emotes');
    for (let i = 0; i < output.length; i++) {
      if (typeof output[i] !== 'string') {
        continue;
      }
      const outputString = String(output[i]);
      // checking emotes
      for (const emote of emotesCache) {
        if (get(item, `allowEmotes.${emote.type}`, false)) {
          if (outputString.includes(emote.code)) {
            output[i] = reactStringReplace(output[i] as React.ReactNode[], emote.code, () => <img title='emote' src={emote.urls[3]} style={{
              position: 'relative', top: '0.1rem', height: item.font ? item.font.size : parent[item.globalFont].size, width: 'auto',
            }}/>);
          }
        }
      }
    }

    console.log('============ Replacing \n with <br/>');
    for (let i = 0; i < output.length; i++) {
      if (typeof output[i] !== 'string') {
        continue;
      }
      output[i] = reactStringReplace(output[i] as React.ReactNode[], '\n', () => <br/>);
    }
    return output;
  }, [item.messageTemplate, variant, curIdx, emitData[groupId], active, test]);

  const [ itemAnimationTriggered, setItemAnimationTriggered ] = React.useState(false);

  // countdown timer for item to be hidden
  const [ timestamp, setTimestamp ] = React.useState<number>(variant.alertDuration);
  useIntervalWhen(() => {
    setTimestamp((t) => t - 100);
  }, 100, timestamp > 0 && active);

  const [ endAnimationShouldPlay, setEndAnimationShouldPlay ] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (active) {
      setItemAnimationTriggered(true);
    }

    // reset timestamp
    setTimestamp(variant.alertDuration);

    if (!active && itemAnimationTriggered) {
      setEndAnimationShouldPlay(true);

      setTimeout(() => {
        if (test) {
          console.log('= Resetting animation');
          setEndAnimationShouldPlay(false);
          setItemAnimationTriggered(false);
        }
      }, (item.animationOutDuration ?? variant.animationOutDuration) + 5000);
    }
  }, [ active, itemAnimationTriggered ]);

  const animationType = React.useMemo(() => {
    if (!itemAnimationTriggered) {
      return 'none';
    }
    const animation = !endAnimationShouldPlay
      ? item.animationIn ?? variant.animationIn
      : item.animationOut ?? variant.animationOut;

    const animationBoundaries = !endAnimationShouldPlay
      ? variant.animationInWindowBoundaries
      : variant.animationOutWindowBoundaries;

    if (animationBoundaries) {
      if (animation.startsWith('slideIn') || animation.startsWith('slideOut')) {
        return `${animation}Window`;
      }
    }

    return animation;
  }, [ timestamp, itemAnimationTriggered, endAnimationShouldPlay ]);
  const animationDuration = React.useMemo(() => {
    if (!itemAnimationTriggered) {
      return 0; // disable animations if not active
    }
    return !endAnimationShouldPlay
      ? item.animationInDuration ?? variant.animationInDuration
      : item.animationOutDuration ?? variant.animationOutDuration;
  }, [ timestamp, itemAnimationTriggered, endAnimationShouldPlay ]);
  const animationDelay = React.useMemo(() => itemAnimationTriggered && !endAnimationShouldPlay
    ? item.animationDelay ?? 0
    : 0, [ itemAnimationTriggered, endAnimationShouldPlay ]);

  return <Box
    sx={{
      width:             '100%',
      height:            '100%',
      position:          'relative',
      overflow:          'visible',
      textTransform:     'none',
      lineHeight:        'initial',
      animationDuration: `${animationDuration}ms !important`,
      animationDelay:    `${animationDelay}ms !important`,
    }}
    className={`animate__animated animate__${animationType}`}
  >
    <Box sx={{
      width:      `${width}px`,
      height:     `${height}px`,
      position:   'absolute',
      textAlign:  item.font ? item.font.align : parent[item.globalFont].align,
      fontFamily: `${encodeFont(item.font ? item.font.family : parent[item.globalFont].family)} !important`,
      fontSize:   `${item.font ? item.font.size : parent[item.globalFont].size}px !important`,
      fontWeight: `${item.font ? item.font.weight : parent[item.globalFont].weight} !important`,
      color:      `${item.font ? item.font.color : parent[item.globalFont].color} !important`,
      textShadow: `${[
        textStrokeGenerator(item.font ? item.font.borderPx : parent[item.globalFont].borderPx, item.font ? item.font.borderColor : parent[item.globalFont].borderColor),
        shadowGenerator(item.font ? item.font.shadow : parent[item.globalFont].shadow)].filter(Boolean).join(', ')} !important`,
    }}>
      {text.map((node, idx) => <React.Fragment key={idx}>{node}</React.Fragment>)}
    </Box>
  </Box>;
};
