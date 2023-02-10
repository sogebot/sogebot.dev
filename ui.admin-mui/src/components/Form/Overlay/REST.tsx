import { ExpandMoreTwoTone } from '@mui/icons-material';
import {
  Accordion, AccordionDetails, AccordionSummary, Alert, Box, Typography,
} from '@mui/material';
import { Overlay } from '@sogebot/backend/dest/database/entity/overlay';
import React from 'react';
import { useSessionstorageState } from 'rooks';

type Props = {
  id: string;
  opts: Overlay['items'][number]['opts'];
};

export const RestAPI: React.FC<Props> = ({ id, opts }) => {
  const [ open, setOpen ] = React.useState(false);
  const [server] = useSessionstorageState('server', 'https://demobot.sogebot.xyz');

  return <Accordion expanded={open}>
    <AccordionSummary
      expandIcon={<ExpandMoreTwoTone />}
      onClick={() => setOpen(o => !o)}
      aria-controls="panel1a-content"
      id="panel1a-header"
    >
      <Typography>REST API</Typography>
    </AccordionSummary>
    <AccordionDetails>
      <Alert severity='info'>List of available calls, all calls need to have authorization token.</Alert>
      <Box sx={{
        '& > .MuiTypography-root': {
          '& > .MuiTypography-root': { fontSize: '0.9rem !important' },
          fontFamily:                '\'Roboto Mono\', monospace',
          fontSize:                  '10px',
          py:                        1,
        },
      }}>
        {opts.typeId === 'countdown' && <>
          <Typography>
            <Typography component='span' variant='h6' sx={{ display: 'block' }}>Set countdown time in miliseconds</Typography>
            <strong>POST</strong> {server}/api/overlays/countdown/{ id }/set
            <br/>Authorization: Bearer &lt;socketToken&gt;
            <br/>Content-Type: application/json

            <br/><br/>
            {JSON.stringify({ time: 60000 })}
          </Typography>
          <Typography>
            <Typography component='span' variant='h6' sx={{ display: 'block' }}>Start countdown</Typography>
            <strong>POST</strong> {server}/api/overlays/countdown/{ id }/start<br/>Authorization: Bearer &lt;socketToken&gt;
          </Typography>
          <Typography>
            <Typography component='span' variant='h6' sx={{ display: 'block' }}>Stop countdown</Typography>
            <strong>POST</strong> {server}/api/overlays/countdown/{ id }/stop<br/>Authorization: Bearer &lt;socketToken&gt;
          </Typography>
          <Typography>
            <Typography component='span' variant='h6' sx={{ display: 'block' }}>Toggle between start/stop</Typography>
            <strong>POST</strong> {server}/api/overlays/countdown/{ id }/toggle<br/>Authorization: Bearer &lt;socketToken&gt;
          </Typography>
        </>}
      </Box>
    </AccordionDetails>
  </Accordion>;
};