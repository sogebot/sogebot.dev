import { Box } from '@mui/material';
import { CreditsScreenCustom } from '@sogebot/backend/dest/database/entity/overlay';
import React from 'react';

import type { Props } from './ChatItem';
import { getSocket } from '../../helpers/socket';
import { shadowGenerator, textStrokeGenerator } from '../../helpers/text';
import { loadFont } from '../Accordion/Font';

export const CreditsCustomItem: React.FC<Props<CreditsScreenCustom['items'][number]> & { onLoaded?: () => void }>
= ({ item, active, onLoaded, width, height }) => {
  const [ text, setText ] = React.useState('');

  const iframeRef = React.useRef<HTMLIFrameElement>(null);
  const iframeSrc = React.useMemo(() => {
    // #wrapper is added for backward compatibility
    const html = `<html>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=${item.font.family.replaceAll(' ', '+')}&display=swap">
    <style>
      #wrapper {
        text-align:  ${item.font.align};
        color:       ${item.font.color};
        font-family: ${item.font.family};
        font-weight: ${item.font.weight};
        font-size:   ${item.font.size}px;
        text-shadow:  ${[textStrokeGenerator(item.font.borderPx, item.font.borderColor), shadowGenerator(item.font.shadow)].filter(Boolean).join(', ')};
      }
      ${item.css}
    </style>
    <body id="wrapper">
      ${text}
    </body>
    </html>
    `;
    const blob = new Blob([html], { type: 'text/html;charset=UTF-8' });
    return window.URL.createObjectURL(blob);
  }, [text, item.css, item.font]);

  React.useEffect(() => {
    loadFont(item.font.family);
    getSocket('/registries/overlays', true).emit('parse', item.html, (err, parsed) => {
      if (err) {
        console.error(err);
      } else {
        setText(parsed);
        onLoaded && onLoaded();
      }
    });
  }, [active, item]);

  return <Box sx={{
    width:         '100%',
    height:        '100%',
    position:      'relative',
    overflow:      'hidden',
    textTransform: 'none',
    lineHeight:    'initial',
  }}>
    {/* we need to create overlay over iframe so it is visible but it cannot be clicked */}
    <Box sx={{
      width:    `${width}px`,
      height:   `${height}px`,
      position: 'absolute',
    }}/>
    <iframe title="iframe-content" ref={iframeRef} src={iframeSrc} scrolling='no' style={{
      width: '100%', height: '100%', border: 0,
    }}/>
  </Box>;
};