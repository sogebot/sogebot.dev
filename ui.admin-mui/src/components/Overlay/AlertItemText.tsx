import { Box } from '@mui/material';
import { Alerts, AlertText } from '@sogebot/backend/src/database/entity/overlay';
import baffle from 'baffle';
import React from 'react';
import { Typewriter } from 'react-simple-typewriter';
import reactStringReplace from 'react-string-replace';
import shortid from 'shortid';

import type { Props } from './ChatItem';
import { shadowGenerator, textStrokeGenerator } from '../../helpers/text';
import { speedOptions } from '../Form/Overlay/AlertSettings/Accordion/AnimationText';

const encodeFont = (font: string) => {
  return `'${font}'`;
};

const regexp = new RegExp(/\*(?<text>.*?)\*/g);

export const AlertItemText: React.FC<Props<AlertText> & { parent: Alerts, variant: Omit<Alerts['items'][number], 'variants'> }>
= ({ item, width, height, parent, variant }) => {
  const text = React.useMemo<React.ReactNode[]>(() => {
    const template = item.messageTemplate;
    let replacedText: React.ReactNode[] = [];

    [...template.matchAll(regexp)].forEach((match, idx) => {
      console.log({ match });
      let animatedText: React.JSX.Element[] = [];

      if (variant.animationText === 'baffle') {
        const baffleId = shortid();
        animatedText = [<span className={`obfuscate-${baffleId}`}>{match.groups!.text}</span>];
        setTimeout(() => {
          baffle('.obfuscate-' + baffleId, {
            characters: variant.animationTextOptions.characters,
            speed:      ((speedOptions.length - speedOptions.findIndex(v => v === variant.animationTextOptions.speed)) * 50),
          }).start().reveal(variant.animationTextOptions.maxTimeToDecrypt, variant.animationTextOptions.maxTimeToDecrypt);
        }, 200);
      } else if (variant.animationText === 'typewriter') {
        // empty word to make sure that delay is used
        console.log('Delay', (idx) * 5000);
        animatedText = [<Typewriter words={['', match.groups!.text]} loop={1} cursor cursorStyle='_' delaySpeed={idx * 1000}/>];
      } else {
        animatedText = match.groups!.text.split('').map((char, index) => <div
          className={`animate__animated animate__infinite animate__${variant.animationText}  animate__${variant.animationTextOptions.speed}`}
          style={{
            animationDelay: (index * 50) + 'ms',
            display:        'inline-block',
          }}>
          { char === ' ' ? '&nbsp;' : char }
        </div>);
      }

      replacedText = reactStringReplace(replacedText.length === 0 ? template : replacedText, match[0], () => <span style={{ color: item.font ? item.font.highlightcolor : parent[item.globalFont].highlightcolor }}>{animatedText}</span>,
      );
    });
    return replacedText.length > 0 ? replacedText : [<span>{template}</span>];
  }, [item, parent, variant]);

  return <Box sx={{
    width:         '100%',
    height:        '100%',
    position:      'relative',
    overflow:      'visible',
    textTransform: 'none',
    lineHeight:    'initial',
  }}>
    {/* we need to create overlay over iframe so it is visible but it cannot be clicked */}
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
      {text}
    </Box>
  </Box>;
};
