import { ContentPasteTwoTone, DoneTwoTone } from '@mui/icons-material';
import { IconButton, Tooltip } from '@mui/material';
import React from 'react';

const CopyButton: React.FC<{ text: string }> = (props) => {
  const [ copied, setCopied ] = React.useState(false);
  const copyToClipboard = () => {
    navigator.clipboard.writeText(props.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  };

  return <Tooltip title="Copied to clipboard!"
    disableInteractive
    open={copied}>
    <IconButton onClick={copyToClipboard}>
      <ContentPasteTwoTone/>
      <DoneTwoTone sx={{
        position: 'absolute', fontSize: '14px', opacity: copied ? 1 : 0, transition: 'opacity 100ms',
      }}/>
    </IconButton>
  </Tooltip>;

};

export { CopyButton };