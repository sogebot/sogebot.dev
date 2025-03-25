import { Alerts, Countdown, CreditsScreenEvents, Eventlist, Wordcloud } from '@entity/overlay';
import { Randomizer } from '@entity/randomizer';
import { AddTwoTone, ExpandMoreTwoTone } from '@mui/icons-material';
import { Accordion, AccordionDetails, AccordionProps, AccordionSummary, Autocomplete, Box, Button, Divider, Fade, FormControl, FormLabel, InputLabel, MenuItem, Paper, Select, Slider, Stack, Tab, Tabs, TextField, Typography } from '@mui/material';
import match from 'autosuggest-highlight/match';
import parse from 'autosuggest-highlight/parse';
import capitalize from 'lodash/capitalize';
import { MuiColorInput } from 'mui-color-input';
import { nanoid } from 'nanoid';
import React from 'react';

import fonts from '../../fonts.json';
import { shadowGenerator, textStrokeGenerator } from '../../helpers/text';
import { useTranslation } from '../../hooks/useTranslation';
import theme from '../../theme';
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
  model:                   T,
  open:                    string,
  onOpenChange:            (value: string) => void;
  onChange:                (value: T) => void;
  disableExample?:         boolean;
  label?:                  string;
  alwaysShowLabelDetails?: boolean;
  prepend?:                string | React.JSX.Element | null;
  customLabelDetails?:     string | React.JSX.Element | null;
  isEditable?:             boolean;
};
type FontTypes = Randomizer['customizationFont']
| Alerts['globalFont1']
| Countdown['countdownFont']
| Wordcloud['wordFont']
| Eventlist['usernameFont']
| CreditsScreenEvents['headerFont'];
export const AccordionFont = <T extends FontTypes>(props: Props<T>) => {
  const accordionId = React.useMemo(() => nanoid(), []);
  const { open,
    onOpenChange,
    onChange,
    model,
    disableExample,
    label,
    isEditable,
    ...accordionProps } = props;

  const { translate } = useTranslation();
  const [ exampleText, setExampleText ] = React.useState('The quick brown fox jumps over the lazy dog');
  const [ shadowTab, setShadowTab ] = React.useState(0);

  const handleClick = () => {
    onOpenChange(open === accordionId ? '' : accordionId);
  };

  React.useEffect(() => {
    if (model && 'family' in model) {
      loadFont(model.family);
    }
  }, [ model?.family ]);

  return <Accordion {...accordionProps} disabled={props.disabled} expanded={open === accordionId && !props.disabled}>
    <AccordionSummary
      expandIcon={<ExpandMoreTwoTone />}
      onClick={() => handleClick()}
      aria-controls="panel1a-content"
      id="panel1a-header"
    >
      <Typography sx={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', width: '100%',
      }}>
        { label ?? translate('registry.alerts.font.setting') }

        <Fade in={open !== accordionId || props.alwaysShowLabelDetails}>
          <Typography component='span' variant='caption' sx={{ textAlign: 'right' }}>
            {props.customLabelDetails
              ? props.customLabelDetails
              : model && (
                <>
                  {model.family}
                  {'size' in model ? ` ${model.size}px` : ''}
                </>
              )}
          </Typography>
        </Fade>
      </Typography>
    </AccordionSummary>
    <AccordionDetails>
      {props.prepend && props.prepend}

      {(isEditable || typeof isEditable === 'undefined') && <>
        <Stack spacing={0.5}>
          {'family' in model && <Autocomplete
            sx={{ mx: '0px !important' }}
            value={model.family}
            disableClearable
            onChange={(ev, value) => onChange({
              ...model, family: value as typeof model.family,
            })}
            id="registry.alerts.font.name"
            options={fonts.items.map(o => o.family)}
            renderInput={(params) => <TextField {...params} label={translate('registry.alerts.font.name')} />}
            renderOption={(p, option, { inputValue }) => {
              const matches = match(option, inputValue, { insideWords: true });
              const parts = parse(option, matches);

              return (
                <li {...p}>
                  <div>
                    {parts.map((part, index) => (
                      <span
                        key={index}
                        style={{
                          backgroundColor: part.highlight ? theme.palette.primary.main : 'inherit',
                          color:           part.highlight ? 'black' : 'inherit',
                        }}
                      >
                        {part.text}
                      </span>
                    ))}
                  </div>
                </li>
              );
            }}
          />}

          {'align' in model && <FormControl fullWidth variant="filled" >
            <InputLabel id="registry.alerts.font.align">{translate('registry.alerts.font.align.name')}</InputLabel>
            <Select
              MenuProps={{ PaperProps: { sx: { maxHeight: 200 } } }}
              label={translate('registry.alerts.font.align.name')}
              labelId="registry.alerts.font.align"
              value={model.align}
              onChange={(ev) => onChange({
                ...model, align: ev.target.value as typeof model.align,
              })}
            >
              <MenuItem value='left' key='left'>{capitalize(translate('registry.alerts.font.align.left'))}</MenuItem>
              <MenuItem value='center' key='center'>{capitalize(translate('registry.alerts.font.align.center'))}</MenuItem>
              <MenuItem value='right' key='right'>{capitalize(translate('registry.alerts.font.align.right'))}</MenuItem>
            </Select>
          </FormControl>}

          {'color' in model && model.color !== null && <MuiColorInput
            label={ translate('registry.alerts.font.color.name') }
            fullWidth
            isAlphaHidden
            format="hex"
            value={isHexColor(model.color) ? model.color : '#111111'}
            onChange={(_, value) => onChange({
              ...model, color: isHexColor(value.hex) && value.hex.length > 0 ? value.hex : '#111111',
            })} />}

          {'highlightcolor' in model && model.highlightcolor !== null && <MuiColorInput
            label={ translate('registry.alerts.font.highlightcolor.name') }
            fullWidth
            isAlphaHidden
            format="hex"
            value={isHexColor(String(model.highlightcolor)) ? String(model.highlightcolor) : '#111111'}
            onChange={(_, value) => onChange({
              ...model, highlightcolor: isHexColor(value.hex) && value.hex.length > 0 ? value.hex : '#111111',
            })} />}

          {'borderColor' in model && <MuiColorInput
            label={ translate('registry.alerts.font.borderColor.name') }
            fullWidth
            isAlphaHidden
            format="hex"
            value={isHexColor(model.borderColor) ? model.borderColor : '#111111'}
            onChange={(_, value) => onChange({
              ...model, borderColor: isHexColor(value.hex) && value.hex.length > 0 ? value.hex : '#111111',
            })} />}

          {'size' in model && <Stack direction='row' spacing={2} alignItems="center" sx={{ padding: '15px 20px 0px 0' }}>
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

          {'weight' in model && <Stack direction='row' spacing={2} alignItems="center" sx={{ padding: '15px 20px 0px 0' }}>
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

          {'borderPx' in model && <Stack direction='row' spacing={2} alignItems="center" sx={{ padding: '15px 20px 0px 0' }}>
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

          {'pl' in model && <Stack direction='row' spacing={2} alignItems="center" sx={{ padding: '15px 20px 0px 0' }}>
            <FormLabel sx={{ width: '170px' }}>{ translate('registry.alerts.font.pl.name') }</FormLabel>
            <Slider
              step={1}
              min={0}
              max={200}
              valueLabelFormat={(val) => `${val}px`}
              valueLabelDisplay="on"
              value={Number(model.pl)}
              onChange={(_, newValue) => onChange({
                ...model, pl: newValue as number,
              })}/>
          </Stack>}

          {'pr' in model && <Stack direction='row' spacing={2} alignItems="center" sx={{ padding: '15px 20px 0px 0' }}>
            <FormLabel sx={{ width: '170px' }}>{ translate('registry.alerts.font.pr.name') }</FormLabel>
            <Slider
              step={1}
              min={0}
              max={200}
              valueLabelFormat={(val) => `${val}px`}
              valueLabelDisplay="on"
              value={Number(model.pr)}
              onChange={(_, newValue) => onChange({
                ...model, pr: newValue as number,
              })}/>
          </Stack>}

          {'pb' in model && <Stack direction='row' spacing={2} alignItems="center" sx={{ padding: '15px 20px 0px 0' }}>
            <FormLabel sx={{ width: '170px' }}>{ translate('registry.alerts.font.pb.name') }</FormLabel>
            <Slider
              step={1}
              min={0}
              max={200}
              valueLabelFormat={(val) => `${val}px`}
              valueLabelDisplay="on"
              value={Number(model.pb)}
              onChange={(_, newValue) => onChange({
                ...model, pb: newValue as number,
              })}/>
          </Stack>}

          {'pt' in model && <Stack direction='row' spacing={2} alignItems="center" sx={{ padding: '15px 20px 0px 0' }}>
            <FormLabel sx={{ width: '170px' }}>{ translate('registry.alerts.font.pt.name') }</FormLabel>
            <Slider
              step={1}
              min={0}
              max={200}
              valueLabelFormat={(val) => `${val}px`}
              valueLabelDisplay="on"
              value={Number(model.pt)}
              onChange={(_, newValue) => onChange({
                ...model, pt: newValue as number,
              })}/>
          </Stack>}
          <Divider sx={{
            my: 2, py: 1,
          }}/>
        </Stack>

        {('shadow' in model && model.shadow !== null) && <>
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
              {(model.shadow).map((_, idx) => <Tab label={`Shadow#${idx + 1}`} key={idx}/>)}
            </Tabs>
          </Stack>

          {model.shadow[shadowTab] && <>
            <MuiColorInput
              label={ translate('dialog.font.color') }
              fullWidth
              isAlphaHidden
              format="hex"
              value={isHexColor(model.shadow[shadowTab].color) ? model.shadow[shadowTab].color : '#111111'}
              onChange={(_, newValue) => {
                const shadows = model.shadow;
                const shadowValue = shadows[shadowTab];
                shadowValue.color = newValue.hex;
                onChange({
                  ...model, shadow: [ ...shadows ],
                });
              }}/>

            <Stack direction='row' spacing={2} alignItems="center" sx={{ padding: '15px 20px 0px 0' }}>
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

            <Stack direction='row' spacing={2} alignItems="center" sx={{ padding: '15px 20px 0px 0' }}>
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

            <Stack direction='row' spacing={2} alignItems="center" sx={{ padding: '15px 20px 0px 0' }}>
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

            <Stack direction='row' spacing={2} alignItems="center" sx={{ padding: '15px 20px 0px 0' }}>
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

            <Box sx={{
              mt: 2, textAlign: 'center',
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
            label="Example text"
            value={exampleText}
            onChange={(ev) => setExampleText(ev.currentTarget.value)}
          />

          <Paper
            elevation={0}
            sx={{
              fontSize:        'size' in model ? model.size : '14' + 'px',
              backgroundColor: 'transparent',
              fontWeight:      model.weight,
              fontFamily:      `'${model.family}'`,
              textAlign:       'center',
              textShadow:      'borderPx' in model && 'borderColor' in model && 'shadow' in model
                ? [textStrokeGenerator(model.borderPx, model.borderColor), shadowGenerator(model.shadow)].filter(Boolean).join(', ')
                : [],
            }}>
            <Box sx={{
              lineHeight: (('size' in model ? model.size : 14) + 15) + 'px',
              width:      '90%',
            }}>
              <div style={{
                overflow: 'visible !important', textAlign: 'center',
              }}>
                { exampleText }
              </div>
            </Box>
          </Paper>
        </>}
      </>}
    </AccordionDetails>
  </Accordion>;
};