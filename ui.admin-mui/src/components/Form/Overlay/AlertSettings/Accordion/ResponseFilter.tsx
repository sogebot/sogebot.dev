import { ContentCopyTwoTone, ExpandMoreTwoTone } from '@mui/icons-material';
import { Accordion, AccordionDetails, AccordionProps, AccordionSummary, Fade, IconButton, InputAdornment, TextField, Typography } from '@mui/material';
import { nanoid } from 'nanoid';
import { useSnackbar } from 'notistack';
import React from 'react';

type Props = Omit<AccordionProps, 'children' | 'onChange'> & {
  model:        string,
  onOpenChange: (value: string) => void;
  open:         string,
};

export const AccordionResponseFilter: React.FC<Props> = (props) => {
  const { enqueueSnackbar } = useSnackbar();
  const [accordionId] = React.useState(nanoid());
  const { open,
    onOpenChange,
    ...accordionProps } = props;

  const handleClick = () => {
    onOpenChange(open === accordionId ? '' : accordionId);
  };

  const triggerAlertResponseFilter = `$triggerAlert(${props.model})`;

  const copy = () => {
    navigator.clipboard.writeText(`${triggerAlertResponseFilter}`);
    enqueueSnackbar(<div>Response filter copied to clipboard.</div>);
  };

  return <Accordion {...accordionProps} expanded={open === accordionId && !props.disabled}>
    <AccordionSummary
      expandIcon={<ExpandMoreTwoTone />}
      onClick={() => handleClick()}
      aria-controls="panel1a-content"
      id="panel1a-header"
    >
      <Typography sx={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', width: '100%',
      }}>
        Response filter

        <Fade in={open !== accordionId}>
          <Typography component='div' variant='caption' sx={{
            textAlign:    'right',
            overflow:     'hidden',
            textOverflow: 'ellipsis',
            whiteSpace:   'nowrap',
            maxWidth:     '180px',
          }}>
            {triggerAlertResponseFilter}
          </Typography>
        </Fade>
      </Typography>
    </AccordionSummary>
    <AccordionDetails>
      <TextField
        fullWidth
        disabled
        value={triggerAlertResponseFilter}
        helperText="Be careful, not all variables may be available if triggered by response filter"
        sx={{ '& .MuiFilledInput-input': { p: '10px' } }}
        InputProps={{
          endAdornment: <InputAdornment position='end'>
            <IconButton onClick={copy}>
              <ContentCopyTwoTone/>
            </IconButton>
          </InputAdornment>,
        }}
      />
    </AccordionDetails>
  </Accordion>;
};