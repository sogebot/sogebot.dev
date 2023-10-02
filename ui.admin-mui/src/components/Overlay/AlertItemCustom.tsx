import { Box } from '@mui/material';
import { AlertCustom, Alerts } from '@sogebot/backend/src/database/entity/overlay';
import React from 'react';

import type { Props } from './ChatItem';
import { shadowGenerator, textStrokeGenerator } from '../../helpers/text';
import { loadFont } from '../Accordion/Font';

const encodeFont = (font: string) => {
  return `'${font}'`;
};

export const AlertItemCustom: React.FC<Props<AlertCustom> & { parent: Alerts }>
= ({ item, width, height, parent, active }) => {
  const iframeRef = React.useRef<HTMLIFrameElement>(null);
  const iframeSrc = React.useMemo(() => {
    // #wrapper is added for backward compatibility
    const html = `<html>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=${(item.font ? item.font : parent[item.globalFont]).family.replaceAll(' ', '+')}&display=swap">
    <style>
      #wrapper {
        text-align:  ${item.font ? item.font.align : parent[item.globalFont].align};
        color:       ${item.font ? item.font.color : parent[item.globalFont].color};
        font-family: ${encodeFont(item.font ? item.font.family : parent[item.globalFont].family)} !important};
        font-weight: ${item.font ? item.font.weight : parent[item.globalFont].weight};
        font-size:   ${item.font ? item.font.size : parent[item.globalFont].size}px !important;
        text-shadow:  ${[
    textStrokeGenerator(item.font ? item.font.borderPx : parent[item.globalFont].borderPx, item.font ? item.font.borderColor : parent[item.globalFont].borderColor),
    shadowGenerator(item.font ? item.font.shadow : parent[item.globalFont].shadow)].filter(Boolean).join(', ')} !important;
      };
      ${item.css}
    </style>
    <body id="wrapper">
      ${item.html}
    </body>
    </html>
    `;
    const blob = new Blob([html], { type: 'text/html;charset=UTF-8' });
    return window.URL.createObjectURL(blob);
  }, [item.html, item.css, item.font, parent]);

  React.useEffect(() => {
    loadFont(item.font ? item.font.family : parent[item.globalFont].family);
  }, [active, item]);

  return <Box sx={{
    width:         '100%',
    height:        '100%',
    position:      'relative',
    textTransform: 'none',
    lineHeight:    'initial',
    overflow:      'visible',
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
