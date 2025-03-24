import { Wordcloud as WordcloudEntity } from '@entity/overlay';
import { Box } from '@mui/material';
import React, { useEffect, useRef } from 'react';
import WordCloud from 'wordcloud';

import type { Props } from './ChatItem';
import { getSocket } from '../../helpers/socket';
import { loadFont } from '../Accordion/Font';

const WordCloudCanvas = ({ words, font, color, weight, width, height }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current) {
      WordCloud(canvasRef.current, {
        list: words,
        gridSize: 5,
        rotateRatio: 0.25,
        weightFactor: 10,
        fontFamily: font,
        fontWeight: weight,
        color: color,
        backgroundColor: '#ffffff00',
      });
    }
  }, [words]);

  return <canvas ref={canvasRef} width={width} height={height} style={{
    padding: '1em',
  }}/>;
};

const time = {
  seconds: 1000,
  minutes: 60 * 1000,
  hours:   60 * 60 * 1000,
} as const;

export const WordcloudItem: React.FC<Props<WordcloudEntity>> = ({ item, active, width, height }) => {
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
    // change wordObj format {text, value} to [[text, value], [text, value]]
    const wordArray: [string, number][] = [];
    for (const key of Object.keys(obj)) {
      wordArray.push([key, obj[key]]);
    }
    return wordArray;
  }, [words]);

  React.useEffect(() => {
    loadFont(item.wordFont.family);

    getSocket('/overlays/wordcloud').on('wordcloud:word', data => {
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
    <WordCloudCanvas key={`${width}-${height}-${words.join('-')}`} words={computedWords} font={item.wordFont.family} color={item.wordFont.color} weight={item.wordFont.weight} width={width} height={height}/>
  </Box>;
};