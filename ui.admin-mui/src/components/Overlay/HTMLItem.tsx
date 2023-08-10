import { Box } from '@mui/material';
import { HTML } from '@sogebot/backend/dest/database/entity/overlay';
import React from 'react';
import { useIntervalWhen } from 'rooks';

import type { Props } from './ChatItem';
import { getSocket } from '../../helpers/socket';

const run = (type: 'onLoad' | 'onChange', contentWindow: Window, retry = 0) => {
  if (retry > 10000) {
    console.error('Cannot load script', type);
    return;
  }

  if (type in contentWindow) {
    (contentWindow as any)[type]();
  } else {
    setTimeout(() => {
      run(type, contentWindow, retry + 1);
    }, 10);
  }
};

export const HTMLItem: React.FC<Props<HTML>> = ({ item, active, width, height }) => {
  const [ text, setText ] = React.useState('');

  const iframeRef = React.useRef<HTMLIFrameElement>(null);
  const iframeSrc = React.useMemo(() => {
    // #wrapper is added for backward compatibility
    const html = `<html>
    <style>
      ${item.css}
    </style>
    <body id="wrapper">
      ${text}
    </body>
    <script type="text/javascript">
      ${item.javascript}
    </script>
    </html>
    `;
    const blob = new Blob([html], { type: 'text/html' });
    return window.URL.createObjectURL(blob);
  }, [text, item.css, item.javascript]);

  const onChange = () => {
    console.group('onChange()');
    console.log(item.javascript);
    console.groupEnd();

    const onChangeAvailable = eval(item.javascript + '; typeof onChange === "function";');
    if (iframeRef.current && iframeRef.current.contentWindow && onChangeAvailable) {
      run('onChange', iframeRef.current.contentWindow);
    }
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
  }, 2000, true, true);

  React.useEffect(() => {
    if (active) {
      console.log('====== TEXT REGISTRY ======');
      console.group('onLoad()');
      console.log(item.javascript);
      console.groupEnd();

      const onLoadAvailable = eval(item.javascript + '; typeof onLoad === "function";');
      if (iframeRef.current && iframeRef.current.contentWindow && onLoadAvailable) {
        run('onLoad', iframeRef.current.contentWindow);
      }
    }
    if (!item.html.includes('$_')) {
      setText(item.html);
    }
  }, [active, item, iframeRef]);

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
    <iframe title="iframe-content" ref={iframeRef} src={iframeSrc} style={{
      width: '100%', height: '100%', border: 0,
    }}/>
  </Box>;
};