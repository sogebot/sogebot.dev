import { AddTwoTone, ExpandMoreTwoTone } from '@mui/icons-material';
import {
  Accordion, AccordionDetails, AccordionProps, AccordionSummary, Box, Button, Divider,
  FormControl, FormLabel, InputLabel, MenuItem, Paper, Select, Slider, Stack,
  Tab, Tabs, TextField, Typography,
} from '@mui/material';
import { Countdown, Eventlist } from '@sogebot/backend/dest/database/entity/overlay';
import { Randomizer } from '@sogebot/backend/dest/database/entity/randomizer';
import axios from 'axios';
import { MuiColorInput } from 'mui-color-input';
import React from 'react';
import { useSessionstorageState } from 'rooks';

import { shadowGenerator, textStrokeGenerator } from '../../helpers/text';
import { useTranslation } from '../../hooks/useTranslation';
import { isHexColor } from '../../validators';

const fontsLoaded: string[] = [];
export function loadFont (value: string) {
  if (fontsLoaded.includes(value)) {
    return;
  }
  fontsLoaded.push(value);

  const head = document.getElementsByTagName('head')[0];
  const style = document.createElement('style');
  style.type = 'text/css';
  console.debug('Loading font', value);
  const font = value.replace(/ /g, '+');
  const css = '@import url(\'https://fonts.googleapis.com/css?family=' + font + '\');';
  style.appendChild(document.createTextNode(css));
  head.appendChild(style);
}

type Props<T> = Omit<AccordionProps, 'children' | 'onChange'> & {
  model: T,
  open: string,
  onClick: (value: string) => void;
  onChange: (value: T) => void;
  disableExample?: boolean;
  label?: string;
  accordionId?: string;
};
export const AccordionFont = <T extends Randomizer['customizationFont'] | Countdown['countdownFont'] | Eventlist['usernameFont']>(props: Props<T>) => {
  const accordionId = props.accordionId ?? 'font';
  const { open,
    onClick,
    onChange,
    model,
    disableExample,
    label,
    ...accordionProps } = props;
  const { translate } = useTranslation();
  const [server] = useSessionstorageState('server', 'https://demobot.sogebot.xyz');
  const [ fonts, setFonts ] = React.useState<string[]>([]);
  const [ exampleText, setExampleText ] = React.useState('The quick brown fox jumps over the lazy dog');
  const [ shadowTab, setShadowTab ] = React.useState(0);

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
      <Typography>{ label ?? translate('registry.alerts.font.setting') }</Typography>
    </AccordionSummary>
    <AccordionDetails>
      {fonts.length > 0 && <FormControl fullWidth variant="filled" >
        <InputLabel id="registry.alerts.font.name">{translate('registry.alerts.font.name')}</InputLabel>
        <Select
          MenuProps={{ PaperProps: { sx: { maxHeight: 200 } } }}
          label={translate('registry.alerts.font.name')}
          labelId="registry.alerts.font.name"
          value={model.family}
          onChange={(ev) => onChange({
            ...model, family: ev.target.value as typeof model.family,
          })}
        >
          {fonts.map(o => <MenuItem value={o} key={o}>{o}</MenuItem>)}
        </Select>
      </FormControl>}

      {'align' in model && <FormControl fullWidth variant="filled" >
        <InputLabel id="registry.alerts.font.align">{translate('registry.alerts.font.align')}</InputLabel>
        <Select
          MenuProps={{ PaperProps: { sx: { maxHeight: 200 } } }}
          label={translate('registry.alerts.font.align')}
          labelId="registry.alerts.font.align"
          value={model.align}
          onChange={(ev) => onChange({
            ...model, align: ev.target.value as typeof model.align,
          })}
        >
          <MenuItem value='left' key='left'>Left</MenuItem>
          <MenuItem value='center' key='center'>Center</MenuItem>
          <MenuItem value='right' key='right'>Reft</MenuItem>
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

      {'color' in model && <Box
        sx={{ pt: 2 }}>
        <MuiColorInput
          label={ translate('registry.alerts.font.color.name') }
          fullWidth
          isAlphaHidden
          format="hex"
          variant='filled'
          value={isHexColor(model.color) ? model.color : '#111111'}
          onChange={(_, value) => onChange({
            ...model, color: isHexColor(value.hex) && value.hex.length > 0 ? value.hex : '#111111',
          })} />
      </Box>}

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

      {(model.shadow !== undefined && model.shadow !== null) && <>
        <Stack direction='row'>
          <Button
            onClick={() => {
              onChange({
                ...model,
                shadow: [
                  ...model.shadow,
                  {
                    shiftRight: 1,
                    shiftDown:  1,
                    blur:       5,
                    opacity:    100,
                    color:      '#ffffff',
                  },
                ],
              });
            }}
            sx={{
              height: 'fit-content', transform: 'translateY(6px)',
            }}><AddTwoTone/> Add new Shadow</Button>
          <Tabs
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              flexShrink: '10000', width: '100%',
            }}
            value={shadowTab}
            onChange={(_, value) => setShadowTab(value)}>
            {model.shadow.map((_, idx) => <Tab label={`Shadow#${idx + 1}`} key={idx}/>)}
          </Tabs>
        </Stack>

        {model.shadow[shadowTab] && <>
          <Stack direction='row' spacing={2} alignItems="center" sx={{ padding: '20px 20px 0px 0' }}>
            <FormLabel sx={{ width: '170px' }}>{ translate('dialog.font.shadowShiftRight') }</FormLabel>
            <Slider
              step={1}
              min={-50}
              max={50}
              valueLabelFormat={(val) => `${val}px`}
              valueLabelDisplay="on"
              value={model.shadow[shadowTab].shiftRight}
              onChange={(_, newValue) => {
                const shadows = model.shadow;
                const shadowValue = shadows[shadowTab];
                shadowValue.shiftRight = newValue as number;
                onChange({
                  ...model, shadow: [ ...shadows ],
                });
              }}/>
          </Stack>

          <Stack direction='row' spacing={2} alignItems="center" sx={{ padding: '20px 20px 0px 0' }}>
            <FormLabel sx={{ width: '170px' }}>{ translate('dialog.font.shadowShiftDown') }</FormLabel>
            <Slider
              step={1}
              min={-50}
              max={50}
              valueLabelFormat={(val) => `${val}px`}
              valueLabelDisplay="on"
              value={model.shadow[shadowTab].shiftDown}
              onChange={(_, newValue) => {
                const shadows = model.shadow;
                const shadowValue = shadows[shadowTab];
                shadowValue.shiftDown = newValue as number;
                onChange({
                  ...model, shadow: [ ...shadows ],
                });
              }}/>
          </Stack>

          <Stack direction='row' spacing={2} alignItems="center" sx={{ padding: '20px 20px 0px 0' }}>
            <FormLabel sx={{ width: '170px' }}>{ translate('dialog.font.shadowBlur') }</FormLabel>
            <Slider
              step={1}
              min={0}
              max={50}
              valueLabelDisplay="on"
              value={model.shadow[shadowTab].blur}
              onChange={(_, newValue) => {
                const shadows = model.shadow;
                const shadowValue = shadows[shadowTab];
                shadowValue.blur = newValue as number;
                onChange({
                  ...model, shadow: [ ...shadows ],
                });
              }}/>
          </Stack>

          <Stack direction='row' spacing={2} alignItems="center" sx={{ padding: '20px 20px 0px 0' }}>
            <FormLabel sx={{ width: '170px' }}>{ translate('dialog.font.shadowOpacity') }</FormLabel>
            <Slider
              step={1}
              min={0}
              max={100}
              valueLabelFormat={(val) => `${val}%`}
              valueLabelDisplay="on"
              value={model.shadow[shadowTab].opacity}
              onChange={(_, newValue) => {
                const shadows = model.shadow;
                const shadowValue = shadows[shadowTab];
                shadowValue.opacity = newValue as number;
                onChange({
                  ...model, shadow: [ ...shadows ],
                });
              }}/>
          </Stack>

          <Box
            sx={{ pt: 2 }}>
            <MuiColorInput
              label={ translate('dialog.font.color') }
              fullWidth
              isAlphaHidden
              format="hex"
              variant='filled'
              value={isHexColor(model.shadow[shadowTab].color) ? model.shadow[shadowTab].color : '#111111'}
              onChange={(_, newValue) => {
                const shadows = model.shadow;
                const shadowValue = shadows[shadowTab];
                shadowValue.color = newValue.hex;
                onChange({
                  ...model, shadow: [ ...shadows ],
                });
              }}/>
          </Box>

          <Box sx={{
            my: 2, textAlign: 'center',
          }}>
            <Button
              onClick={() => {
                onChange({
                  ...model, shadow: model.shadow.filter((_, idx) => idx !== shadowTab),
                });
                setShadowTab(0);
              }}
              variant='contained'
              color='error'>{ translate('dialog.buttons.delete') }</Button>
          </Box>
        </>}
      </>}

      {!disableExample && <>
        <Divider sx={{ my: 2 }}/>
        <TextField
          fullWidth
          variant='filled'
          label="Example text"
          value={exampleText}
          onChange={(ev) => setExampleText(ev.currentTarget.value)}
        />

        <Paper
          elevation={0}
          sx={{
            fontSize:        model.size + 'px',
            backgroundColor: 'transparent',
            fontWeight:      model.weight,
            fontFamily:      `'${model.family}'`,
            textAlign:       'center',
            textShadow:      [textStrokeGenerator(model.borderPx, model.borderColor), shadowGenerator(model.shadow)].filter(Boolean).join(', '),
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
      </>}
    </AccordionDetails>
  </Accordion>;
};