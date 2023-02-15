import { Box } from '@mui/material';
import { HTML } from '@sogebot/backend/dest/database/entity/overlay';
import HTMLReactParser from 'html-react-parser';
import React from 'react';
import { Helmet } from 'react-helmet';
import { useIntervalWhen } from 'rooks';
import shortid from 'shortid';

import type { Props } from './ChatItem';
import { getSocket } from '../../helpers/socket';

export const HTMLItem: React.FC<Props<HTML>> = ({ item, active }) => {
  const [wrapper] = React.useState(shortid());

  const [ text, setText ] = React.useState('');

  const onChange = () => {
    console.group('onChange()');
    console.log(item.javascript);
    console.groupEnd();
    // eslint-disable-next-line no-eval
    eval(item.javascript + ';if (typeof onChange === "function") { onChange(); }');
  };

  useIntervalWhen(async () => {
    console.debug(`${Date().toLocaleString()} - refresh()`);
    getSocket('/registries/overlays', true).emit('parse', item.html, (err, parsed) => {
      if (err) {
        console.error(err);
      } else {
        if (text !== parsed) {
          setText(parsed);
          onChange();
        }
      }
    });
  }, 2000, (item.html.includes('$_') || item.javascript.includes('$_')), true);

  React.useEffect(() => {
    if (active) {
      console.log('====== TEXT REGISTRY ======');
      console.log();
      console.group('onLoad()');
      console.log(item.javascript);
      console.groupEnd();
      // eslint-disable-next-line no-eval
      eval(item.javascript + ';if (typeof onLoad === "function") { onLoad(); }');

    }
    if (!item.html.includes('$_')) {
      setText(item.html);
    }
  }, [active, item]);

  return <Box sx={{
    width:         '100%',
    height:        '100%',
    position:      'relative',
    overflow:      'hidden',
    textTransform: 'none',
    lineHeight:    'initial',
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