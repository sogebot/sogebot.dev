import { Box } from '@mui/material';
import { CreditsScreenCustom } from '@sogebot/backend/dest/database/entity/overlay';
import HTMLReactParser from 'html-react-parser';
import React from 'react';
import { Helmet } from 'react-helmet';
import shortid from 'shortid';

import type { Props } from './ChatItem';
import { getSocket } from '../../helpers/socket';
import { shadowGenerator, textStrokeGenerator } from '../../helpers/text';
import { loadFont } from '../Accordion/Font';

export const CreditsCustomItem: React.FC<Props<CreditsScreenCustom['items'][number]>>
= ({ item, active }) => {
  const [wrapper] = React.useState(shortid());

  const [ text, setText ] = React.useState('');

  React.useEffect(() => {
    loadFont(item.font.family);
    getSocket('/registries/overlays', true).emit('parse', item.html, (err, parsed) => {
      if (err) {
        console.error(err);
      } else {
        setText(parsed);
      }
    });
  }, [active, item]);

  return <Box sx={{
    width:         '100%',
    height:        '100%',
    position:      'relative',
    overflow:      'visible',
    textTransform: 'none',
    lineHeight:    'initial',

    textAlign:  item.font.align,
    color:      item.font.color,
    fontFamily: item.font.family,
    fontWeight: item.font.weight,
    fontSize:   item.font.size + 'px',
    textShadow: [textStrokeGenerator(item.font.borderPx, item.font.borderColor), shadowGenerator(item.font.shadow)].filter(Boolean).join(', '),
  }}>
    <Helmet>
      <style type='text/css'>{`
        ${item.css.replace(/#wrapper/gm, `#wrapper-${wrapper}`)}
      `}
      </style>
    </Helmet>
    <div id={`wrapper-${wrapper}`}>
      {HTMLReactParser(text)}
    </div>
  </Box>;
};