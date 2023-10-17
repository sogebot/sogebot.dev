import { Box } from '@mui/material';
import { Alerts, AlertText } from '@sogebot/backend/src/database/entity/overlay';
import baffle from 'baffle';
import { useAtomValue } from 'jotai';
import { get } from 'lodash';
import React from 'react';
import { Typewriter } from 'react-simple-typewriter';
import reactStringReplace from 'react-string-replace';
import { useIntervalWhen } from 'rooks';
import shortid from 'shortid';

import { anEmitData } from './AlertItem/atom';
import type { Props } from './ChatItem';
import { shadowGenerator, textStrokeGenerator } from '../../helpers/text';
import { speedOptions } from '../Form/Overlay/AlertSettings/Accordion/AnimationText';

require('animate.css');

const encodeFont = (font: string) => {
  return `'${font}'`;
};

const regexp = new RegExp(/\*(?<text>.*?)\*/g);
const emotesCache = sessionStorage.getItem('emotes::cache') ? JSON.parse(sessionStorage.getItem('emotes::cache')!) : [];

export const AlertItemText: React.FC<Props<AlertText> & { test?: boolean; parent: Alerts, variant: Omit<Alerts['items'][number], 'variants'> }>
= ({ item, width, height, parent, variant, active, test }) => {
  const [ curIdx, setCurIdx ] = React.useState(0);

  const emitData = useAtomValue(anEmitData);
  useIntervalWhen(() => {
    if (item.messageTemplate.split('|')[curIdx + 1]) {
      setCurIdx((idx) => idx + 1);
    } else {
      setCurIdx(0);
    }
  }, variant.alertDuration / item.messageTemplate.split('|').length);

  const text = React.useMemo<React.ReactNode[]>(() => {
    let template = item.messageTemplate.split('|')[curIdx];

    if (emitData) {
      console.log('= Replacing values');
      template = template
        .replace(/\{name\}/g, emitData.name)
        .replace(/\{game\}/g, emitData.game || '')
        .replace(/\{recipient\}/g, emitData.recipient || '')
        .replace(/\{amount\}/g, String(emitData.amount))
        .replace(/\{monthsName\}/g, emitData.monthsName)
        .replace(/\{currency\}/g, emitData.currency)
        .replace(/\{message\}/g, emitData.message);
    }

    let replacedText: React.ReactNode[] = [];

    [...template.matchAll(regexp)].forEach((match, idx) => {
      let animatedText: React.JSX.Element[] = [];

      if (variant.animationText === 'baffle') {
        const baffleId = shortid();
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
            output[i] = reactStringReplace(output[i] as React.ReactNode[], emote.code, () => <img src={emote.urls[3]} style={{
              position: 'relative', top: '0.1rem', height: item.font ? item.font.size : parent[item.globalFont].size, width: 'auto',
            }}/>);
          }
        }
      }
    }
    return output;
  }, [item.messageTemplate, variant, curIdx, emitData]);

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
    return !endAnimationShouldPlay
      ? item.animationIn ?? variant.animationIn
      : item.animationOut ?? variant.animationOut;
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
