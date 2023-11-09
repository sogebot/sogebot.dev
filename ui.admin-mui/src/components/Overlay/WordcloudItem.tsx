import { Box } from '@mui/material';
import { Wordcloud } from '@sogebot/backend/dest/database/entity/overlay';
import React from 'react';
import ReactWordcloud from 'react-d3-cloud';

import type { Props } from './ChatItem';
import { getSocket } from '../../helpers/socket';
import { loadFont } from '../Accordion/Font';

const time = {
  seconds: 1000,
  minutes: 60 * 1000,
  hours:   60 * 60 * 1000,
} as const;

export const WordcloudItem: React.FC<Props<Wordcloud>> = ({ item, active }) => {
  const [ words, setWords ] = React.useState<string[]>(active ? [] : 'Contrary to popular belief Lorem Ipsum is not simply random text It has roots in a piece of classical Latin literature from 45 BC making it over 2000 years old Richard McClintock a Latin professor at Hampden-Sydney College in Virginia looked up one of the more obscure Latin words, consectetur, from a Lorem Ipsum passage, and going through the cites of the word in classical literature, discovered the undoubtable source Lorem Ipsum comes from sections'.toLowerCase().split(' '));

  const computedWords = React.useMemo(() => {
    const obj: Record<string, number> = {};
    for (const word of words) {
      obj[word] = (obj[word] ?? 0) + 1;
    }

    const wordObj: { text: string, value: number }[] = [];
    for (const key of Object.keys(obj)) {
      wordObj.push({
        text: key, value: obj[key],
      });
    }
    return wordObj;
  }, [words]);

  const maxValue = React.useMemo(() => {
    let maxNumber = 0;
    for (const word of computedWords) {
      if (word.value > maxNumber) {
        maxNumber = word.value;
      }
    }
    return maxNumber;
  }, [ computedWords ]);

  const fontSize = React.useCallback((word: { text: string, value: number }) => Math.max(20, (word.value / maxValue) * 100), [maxValue]);
  const rotate = React.useCallback(() => Math.round(Math.random() * 360), []);

  React.useEffect(() => {
    loadFont(item.wordFont.family);

    getSocket('/overlays/wordcloud', true).on('wordcloud:word', data => {
      setWords(w => [...w, ...data]);
      setTimeout(() => {
        setWords(w => {
          const length = data.length;
          const w2 = [...w];
          for (let i = 0 ; i < length ; i ++) {
            w2.shift();
          }
          return w2;
        });
      }, item.fadeOutInterval * (time as any)[item.fadeOutIntervalType]);
    });
    if (active) {
      console.log(`====== WORDCLOUD ======`);
    }
  }, []);

  return <Box sx={{
    width:    '100%',
    height:   '100%',
    overflow: 'hidden',
  }}>
    <ReactWordcloud data={computedWords} fontSize={fontSize} rotate={rotate} font={item.wordFont.family} fill={item.wordFont.color}  />
  </Box>;
};