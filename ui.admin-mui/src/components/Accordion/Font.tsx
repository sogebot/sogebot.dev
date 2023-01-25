import { ExpandMoreTwoTone } from '@mui/icons-material';
import {
  Accordion, AccordionDetails, AccordionProps, AccordionSummary, Box, Divider, FormControl, FormLabel, InputLabel, MenuItem, Paper, Select, Slider, Stack, TextField, Typography,
} from '@mui/material';
import { Randomizer } from '@sogebot/backend/dest/database/entity/randomizer';
import axios from 'axios';
import { MuiColorInput } from 'mui-color-input';
import React from 'react';

import { shadowGenerator, textStrokeGenerator } from '../../helpers/text';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useTranslation } from '../../hooks/useTranslation';
import { isHexColor } from '../../validators';

function loadFont (value: string) {
  const head = document.getElementsByTagName('head')[0];
  const style = document.createElement('style');
  style.type = 'text/css';
  console.debug('Loading font', value);
  const font = value.replace(/ /g, '+');
  const css = '@import url(\'https://fonts.googleapis.com/css?family=' + font + '\');';
  style.appendChild(document.createTextNode(css));
  head.appendChild(style);
}

type Props = Omit<AccordionProps, 'children' | 'onChange'> & {
  model: Randomizer['customizationFont'],
  open: string,
  onClick: (value: string) => void;
  onChange: (value: Randomizer['customizationFont']) => void;
};
export const AccordionFont: React.FC<Props> = (props) => {
  const accordionId = 'font';
  const { open,
    onClick,
    onChange,
    model,
    ...accordionProps } = props;
  const { translate } = useTranslation();
  const [server] = useLocalStorage('server', 'https://demobot.sogebot.xyz');
  const [ fonts, setFonts ] = React.useState<string[]>([]);
  const [ exampleText, setExampleText ] = React.useState('The quick brown fox jumps over the lazy dog');

  const handleClick = () => {
    onClick(open === accordionId ? '' : accordionId);
  };

  React.useEffect(() => {
    if (server) {
      axios.get(`${server}/fonts`)
        .then(({ data }) => {
          setFonts(data.items.map((o: any) => o.family));
        });
    }
  }, [server]);

  React.useEffect(() => {
    loadFont(model.family);
  }, [ model.family ]);

  return <Accordion {...accordionProps} disabled={props.disabled} expanded={open === accordionId && !props.disabled}>
    <AccordionSummary
      expandIcon={<ExpandMoreTwoTone />}
      onClick={() => handleClick()}
      aria-controls="panel1a-content"
      id="panel1a-header"
    >
      <Typography>{ translate('registry.alerts.font.setting') }</Typography>
    </AccordionSummary>
    <AccordionDetails>
      {fonts.length > 0 && <FormControl fullWidth variant="filled" >
        <InputLabel id="registry.alerts.font.name">{translate('registry.alerts.font.name')}</InputLabel>
        <Select
          MenuProps={{ PaperProps: { sx: { maxHeight: 200 } } }}
          label={translate('registry.alerts.voice')}
          labelId="registry.alerts.font.name"
          value={model.family}
          onChange={(ev) => onChange({
            ...model, family: ev.target.value as typeof model.family,
          })}
        >
          {fonts.map(o => <MenuItem value={o} key={o}>{o}</MenuItem>)}
        </Select>
      </FormControl>}

      {model.size !== undefined && <Stack direction='row' spacing={2} alignItems="center" sx={{ padding: '30px 20px 0px 0' }}>
        <FormLabel sx={{ width: '170px' }}>{ translate('registry.alerts.font.size.name') }</FormLabel>
        <Slider
          step={1}
          min={0}
          max={200}
          valueLabelFormat={(val) => `${val}px`}
          valueLabelDisplay="on"
          value={model.size}
          onChange={(_, newValue) => onChange({
            ...model, size: newValue as number,
          })}/>
      </Stack>}

      {model.weight !== undefined && <Stack direction='row' spacing={2} alignItems="center" sx={{ padding: '20px 20px 0px 0' }}>
        <FormLabel sx={{ width: '170px' }}>{ translate('registry.alerts.font.weight.name') }</FormLabel>
        <Slider
          step={100}
          min={100}
          max={900}
          valueLabelDisplay="on"
          value={model.weight}
          onChange={(_, newValue) => onChange({
            ...model, weight: newValue as number,
          })}/>
      </Stack>}

      {model.borderPx !== undefined && <Stack direction='row' spacing={2} alignItems="center" sx={{ padding: '20px 20px 0px 0' }}>
        <FormLabel sx={{ width: '170px' }}>{ translate('registry.alerts.font.borderPx.name') }</FormLabel>
        <Slider
          step={1}
          min={0}
          max={100}
          valueLabelFormat={(val) => `${val}px`}
          valueLabelDisplay="on"
          value={model.borderPx}
          onChange={(_, newValue) => onChange({
            ...model, borderPx: newValue as number,
          })}/>
      </Stack>}

      {model.borderColor !== undefined && <Box
        sx={{ pt: 2 }}>
        <MuiColorInput
          label={ translate('registry.alerts.font.borderColor.name') }
          fullWidth
          isAlphaHidden
          format="hex"
          variant='filled'
          value={isHexColor(model.borderColor) ? model.borderColor : '#111111'}
          onChange={(_, value) => onChange({
            ...model, borderColor: isHexColor(value.hex) && value.hex.length > 0 ? value.hex : '#111111',
          })} />
      </Box>}

      <Divider sx={{ my: 2 }}/>
      <TextField
        fullWidth
        variant='filled'
        label="Example text"
        value={exampleText}
        onChange={(ev) => setExampleText(ev.currentTarget.value)}
      />

      <Paper
        sx={{
          fontSize:   model.size + 'px',
          fontWeight: model.weight,
          fontFamily: `'${model.family}'`,
          textAlign:  'center',
          textShadow: [textStrokeGenerator(model.borderPx, model.borderColor), shadowGenerator(model.shadow)].filter(Boolean).join(', '),
        }}>
        <Box sx={{
          lineHeight: (model.size + 15) + 'px',
          width:      '90%',
        }}>
          <div style={{
            overflow: 'visible !important;', textAlign: 'center',
          }}>
            { exampleText }
          </div>
        </Box>
      </Paper>
    </AccordionDetails>
  </Accordion>;
};