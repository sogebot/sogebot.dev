import { ExpandMoreTwoTone } from '@mui/icons-material';
import {
  Accordion, AccordionDetails, AccordionSummary, Box,
  Button, Divider, FormControl, FormControlLabel, FormHelperText, InputAdornment,
  InputLabel, MenuItem, Select, Stack, Switch, TextField, Typography,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import type { tiltifyCampaign } from '@sogebot/backend/d.ts/src/helpers/socket';
import { Goal } from '@sogebot/backend/dest/database/entity/overlay';
import { flatten } from '@sogebot/backend/dest/helpers/flatten';
import set from 'lodash/set';
import { MuiColorInput } from 'mui-color-input';
import React from 'react';
import { useIntervalWhen } from 'rooks';

import { CSSDialog } from './HTMLSettings/css';
import { HTMLDialog } from './HTMLSettings/html';
import { JavascriptDialog } from './HTMLSettings/javascript';
import { dayjs } from '../../../helpers/dayjsHelper';
import { getSocket } from '../../../helpers/socket';
import { useTranslation } from '../../../hooks/useTranslation';
import { isHexColor } from '../../../validators';
import { AccordionFont } from '../../Accordion/Font';
import { RenderList } from '../../Dashboard/Widget/Action/Dialog/ActionsEdit';
import { FormNumericInput } from '../Input/Numeric';

type Flatten<T extends object> = object extends T ? object : {
  [K in keyof T]-?: (x: NonNullable<T[K]> extends infer V ? V extends object ?
    V extends readonly any[] ? Pick<T, K> : Flatten<V> extends infer FV ? ({
      [P in keyof FV as `${Extract<K, string | number>}.${Extract<P, string | number>}`]:
      FV[P] }) : never : Pick<T, K> : never
  ) => void } extends Record<keyof T, (y: infer O) => void> ? { [K in keyof O]: O[K] } : never;

type Props = {
  model: Goal;
  onUpdate: (value: Goal) => void;
};

export const GoalSettings: React.FC<Props> = ({ onUpdate, model }) => {
  const { translate } = useTranslation();
  const [ tiltifyCampaigns, setTiltifyCampaigns ] = React.useState<tiltifyCampaign[]>([]);

  const [ accordionFontOpen, setAccordionFontOpen ] = React.useState(false);
  const [ accordionBarOpen, setAccordionBarOpen ] = React.useState(false);

  useIntervalWhen(() => {
    getSocket('/integrations/tiltify').emit('tiltify::campaigns', data => setTiltifyCampaigns(data));
  }, 30000, true, true);

  const addNewGoal = () => {
    model.campaigns.push({
      name:            '',
      type:            'followers',
      tiltifyCampaign: null,

      display: 'full',

      customizationBar: {
        color:           '#00aa00',
        backgroundColor: '#e9ecef',
        borderColor:     '#000000',
        borderPx:        0,
        height:          50,
      },
      customizationFont: {
        family:      'Cabin Condensed',
        weight:      500,
        color:       '#ffffff',
        size:        20,
        borderColor: '#000000',
        borderPx:    1,
        shadow:      [],
      },

      countBitsAsTips: false,
      timestamp:       new Date().toISOString(),
      goalAmount:      1000,
      currentAmount:   0,
      interval:        'hour',
      endAfter:        new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      endAfterIgnore:  true,
      customization:   {
        css: '\n\t/* All html objects will be wrapped in the #wrap div */'
        + '\n\n\t#wrap .progress-bar {'
          + '\n\t\tbackground: black;'
        + '\n\t}'
        + '\n',
        html: '\n\t<!-- '
        + '\n\t\tAll html objects will be wrapped in the #wrap div'
        + '\n\t\tAvailable variables:'
          + '\n\t\t\t$name - name of goal ; $type - type of goal ; $goalAmount - total amount'
          + '\n\t\t\t$currentAmount - current amount ; $percentageAmount - how much is achieved ; $endAfter - when goal ends'
      + '\n\t-->'
      + '\n'
      + '\n\t<div>'
        + '\n\t\t<div>$name</div>'
        + '\n\t\t<div>$currentAmount</div>'
        + '\n\t\t<div>$goalAmount</div>'
      + '\n\t</div>'
      + '\n'
      + '\n\t<div>'
        + '\n\t\t<div class="progress-bar" style="width: $percentageAmount%; height: 24px;"></div>'
      + '\n\t</div>'
      + '\n',
        js: '\n\tfunction onChange(currentAmount) {'
        + '\n\t\tconsole.log(\'new value is \' + currentAmount);'
      + '\n\t}'
      + '\n',
      },
    });
    onUpdate(model);
  };

  const updateCampaign = <ATTR extends keyof Flatten<typeof model.campaigns[number]>>(idx: number, attr: ATTR, value: Flatten<typeof model.campaigns[number]>[ATTR]) => {
    set(model.campaigns[idx], attr, value);
    onUpdate(model);
  };

  const removeGoal = (idx: number) => {
    model.campaigns.splice(idx, 1);
    onUpdate(model);
  };

  return <>
    <Stack spacing={0.5}>
      <FormControl fullWidth variant="filled" >
        <InputLabel id="type-select-label">{translate('registry.goals.input.displayAs.title')}</InputLabel>
        <Select
          MenuProps={{ PaperProps: { sx: { maxHeight: 200 } } }}
          label={translate('registry.goals.input.displayAs.title')}
          labelId="type-select-label"
          value={model.display.type}
          onChange={(ev) => {
            let display = model.display;
            if (model.display.type === 'fade' && ev.target.value === 'multi') {
              display = {
                type:                  'multi',
                spaceBetweenGoalsInPx: 0,
              };
            } else {
              display = {
                type:           'fade',
                durationMs:     60000,
                animationInMs:  1000,
                animationOutMs: 1000,
              };
            }
            onUpdate({
              ...model, display,
            });
          }}
        >
          <MenuItem value="fade" key="fade">fade</MenuItem>
          <MenuItem value="multi" key="multi">multi</MenuItem>
        </Select>
        <FormHelperText>{translate('registry.goals.input.displayAs.help')}</FormHelperText>
      </FormControl>

      {model.display.type === 'fade' && <>
        <FormNumericInput
          min={1000}
          value={model.display.durationMs}
          label={translate('registry.goals.input.durationMs.title')}
          InputProps={{ endAdornment: <InputAdornment position='end'>ms</InputAdornment> }}
          onChange={val => {
            if (model.display.type === 'fade') {
              onUpdate({
                ...model,
                display: {
                  ...model.display, durationMs: val as number,
                } as any,
              });
            }
          }}
        />
        <FormNumericInput
          min={1000}
          value={model.display.animationInMs}
          label={translate('registry.goals.input.animationInMs.title')}
          InputProps={{ endAdornment: <InputAdornment position='end'>ms</InputAdornment> }}
          onChange={val => {
            if (model.display.type === 'fade') {
              onUpdate({
                ...model,
                display: {
                  ...model.display, animationInMs: val as number,
                } as any,
              });
            }
          }}
        />
        <FormNumericInput
          min={1000}
          value={model.display.animationOutMs}
          label={translate('registry.goals.input.animationOutMs.title')}
          InputProps={{ endAdornment: <InputAdornment position='end'>ms</InputAdornment> }}
          onChange={val => {
            if (model.display.type === 'fade') {
              onUpdate({
                ...model,
                display: {
                  ...model.display, animationOutMs: val as number,
                } as any,
              });
            }
          }}
        />
      </>
      }
      {model.display.type === 'multi' && <>
        <FormNumericInput
          min={0}
          value={model.display.spaceBetweenGoalsInPx}
          label={translate('registry.goals.input.spaceBetweenGoalsInPx.title')}
          InputProps={{ endAdornment: <InputAdornment position='end'>px</InputAdornment> }}
          onChange={val => {
            if (model.display.type === 'multi') {
              onUpdate({
                ...model,
                display: {
                  ...model.display, spaceBetweenGoalsInPx: val as number,
                } as any,
              });
            }
          }}
        />
      </>
      }
    </Stack>

    <Button sx={{ py: 1.5 }} fullWidth onClick={addNewGoal} variant='contained'>Add new goal</Button>

    <Box sx={{ py: 2 }}>
      <Stack spacing={0.5}>
        {model.campaigns.map((o, idx) => <React.Fragment key={idx}>
          {idx > 0 && <Divider sx={{ margin: '10px 5px 5px 0px !important' }} variant='middle' />}
          <Typography variant='h5'>Goal {idx+1}</Typography>
          <TextField
            label={translate('name')}
            fullWidth
            variant="filled"
            defaultValue={o.name}
            onChange={(ev) => updateCampaign(idx, 'name', ev.currentTarget.value ?? '')}
          />
          <Accordion>
            <AccordionSummary
              expandIcon={<ExpandMoreTwoTone />}
              aria-controls="panel1a-content"
              id="panel1a-header"
            >
              <Typography>Goal settings</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={0.5}>
                <FormControl fullWidth variant="filled" >
                  <InputLabel id="type-select-label">{translate('registry.goals.input.type.title')}</InputLabel>
                  <Select
                    MenuProps={{ PaperProps: { sx: { maxHeight: 200 } } }}
                    label={translate('registry.goals.input.type.title')}
                    labelId="type-select-label"
                    value={o.type}
                    onChange={(ev) => updateCampaign(idx, 'type', ev.target.value as 'followers')}
                  >
                    {[
                      'followers', 'currentFollowers', 'currentSubscribers', 'subscribers',
                      'tips', 'bits', 'intervalSubscribers', 'intervalFollowers', 'intervalTips',
                      'intervalBits', 'tiltifyCampaign',
                    ].map(t => <MenuItem value={t} key={t}>{t}</MenuItem>)}
                  </Select>
                </FormControl>

                {o.type === 'tiltifyCampaign' && <>
                  <FormControl fullWidth variant="filled" >
                    <InputLabel id="type-select-label" shrink>Tiltify Campaign</InputLabel>
                    <Select
                      displayEmpty
                      MenuProps={{ PaperProps: { sx: { maxHeight: 200 } } }}
                      label={'Tiltify Campaign'}
                      labelId="type-select-label"
                      value={o.tiltifyCampaign}
                      renderValue={(selected) => {
                        return <RenderList label={tiltifyCampaigns.find(c => c.id === selected)?.name} id={selected}/>;
                      }}
                      onChange={(ev) => updateCampaign(idx, 'tiltifyCampaign', ev.target.value === '' ? null : Number(ev.target.value))}
                    >
                      <MenuItem value="">
                        <RenderList label={''} id={''}/>
                      </MenuItem>
                      {tiltifyCampaigns.map(t => <MenuItem value={t.id} key={t.id}>
                        <RenderList label={t.name} id={t.id}/>
                      </MenuItem>)}
                    </Select>
                  </FormControl>

                  <FormNumericInput
                    min={0}
                    value={o.currentAmount}
                    label={translate('registry.goals.input.currentAmount.title')}
                    onChange={(ev) => updateCampaign(idx, 'currentAmount', Number(ev ?? 0))}
                  />
                </>}

                {o.type !== 'tiltifyCampaign' && <>
                  {['tips', 'intervalTips'].includes(o.type) && <FormControlLabel sx={{
                    width: '100%', pt: 1,
                  }} control={<Switch
                    checked={o.countBitsAsTips}
                    onChange={(_, checked) => updateCampaign(idx, 'countBitsAsTips', checked)} />}
                  label={translate('registry.goals.input.countBitsAsTips.title')}/>}

                  <FormNumericInput
                    min={0}
                    value={o.goalAmount}
                    label={translate('registry.goals.input.goalAmount.title')}
                    onChange={(ev) => updateCampaign(idx, 'goalAmount', Number(ev ?? 0))}
                  />

                  {(!o.type.includes('current') && !o.type.includes('interval')) && <FormNumericInput
                    min={0}
                    value={o.currentAmount}
                    label={translate('registry.goals.input.currentAmount.title')}
                    onChange={(ev) => updateCampaign(idx, 'currentAmount', Number(ev ?? 0))}
                  />}

                  {o.type.includes('interval') && <FormControl fullWidth variant="filled" >
                    <InputLabel id="type-select-label">{translate('registry.goals.input.interval.title')}</InputLabel>
                    <Select
                      MenuProps={{ PaperProps: { sx: { maxHeight: 200 } } }}
                      label={translate('registry.goals.input.interval.title')}
                      labelId="interval-select-label"
                      value={o.interval}
                      onChange={(ev) => updateCampaign(idx, 'interval', ev.target.value as 'hour')}
                    >
                      {['hour', 'day', 'week', 'month', 'year'].map(t => <MenuItem value={t} key={t}>{t}</MenuItem>)}
                    </Select>
                  </FormControl>}

                  <DateTimePicker
                    disabled={o.endAfterIgnore}
                    value={dayjs(o.endAfter)}
                    onChange={(date) => updateCampaign(idx, 'endAfter', date?.toISOString() ?? new Date(0).toISOString())}
                    label={translate('registry.goals.input.endAfter.title')}
                    slotProps={{
                      textField: {
                        InputProps: {
                          startAdornment: <InputAdornment position="start">
                            <Switch
                              size='small'
                              checked={!o.endAfterIgnore}
                              onChange={(_, checked) => updateCampaign(idx, 'endAfterIgnore', !checked)}
                            />
                          </InputAdornment>,
                        },
                      },
                    }}
                  />
                </>}
              </Stack>
            </AccordionDetails>
          </Accordion>
          <Accordion>
            <AccordionSummary
              expandIcon={<ExpandMoreTwoTone />}
              aria-controls="panel2a-content"
              id="panel2a-header"
            >
              <Typography>Display settings</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={0.5}>
                <FormControl fullWidth variant="filled" >
                  <InputLabel id="type-select-label">{translate('registry.goals.display')}</InputLabel>
                  <Select
                    MenuProps={{ PaperProps: { sx: { maxHeight: 200 } } }}
                    label={translate('registry.goals.display')}
                    labelId="type-select-label"
                    value={o.display}
                    onChange={(ev) => updateCampaign(idx, 'display', ev.target.value as 'full')}
                  >
                    {[
                      'simple', 'full', 'custom',
                    ].map(t => <MenuItem value={t} key={t}>{t}</MenuItem>)}
                  </Select>

                </FormControl>
                {o.display === 'custom' && <>
                  <HTMLDialog model={o.customization.html} onChange={value => updateCampaign(idx, 'customization.html', value)}/>
                  <CSSDialog model={o.customization.css} onChange={value => updateCampaign(idx, 'customization.css', value)}/>
                  <JavascriptDialog model={o.customization.js} onChange={value => updateCampaign(idx, 'customization.js', value)}/>
                </>}
              </Stack>
            </AccordionDetails>
          </Accordion>
          <AccordionFont
            disableExample
            open={accordionFontOpen && o.display !== 'custom' ? 'font' : ''}
            disabled={o.display === 'custom'}
            onOpenChange={() => setAccordionFontOpen(val => !val)}
            model={o.customizationFont}
            onChange={val => {
              const flattenVal = flatten(val);
              for (const key of Object.keys(flattenVal)) {
                updateCampaign(idx, 'customizationFont.' + key as any, flattenVal[key as any]);
              }
            }
            }/>
          <Accordion
            expanded={accordionBarOpen && o.display !== 'custom'}
            disabled={o.display === 'custom'}>
            <AccordionSummary
              onClick={() => setAccordionBarOpen(val => !val)}
              expandIcon={<ExpandMoreTwoTone />}
              aria-controls="panel3a-content"
              id="panel3a-header"
            >
              <Typography>{ translate('registry.goals.barSettings') }</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={0.5}>
                <FormNumericInput
                  min={0}
                  value={o.customizationBar.borderPx}
                  label={translate('registry.goals.input.borderPx.title')}
                  onChange={(ev) => updateCampaign(idx, 'customizationBar.borderPx', Number(ev ?? 0))}
                  InputProps={{ endAdornment: <InputAdornment position='end'>px</InputAdornment> }}
                />
                <FormNumericInput
                  min={0}
                  value={o.customizationBar.height}
                  label={translate('registry.goals.input.barHeight.title')}
                  onChange={(ev) => updateCampaign(idx, 'customizationBar.height', Number(ev ?? 0))}
                  InputProps={{ endAdornment: <InputAdornment position='end'>px</InputAdornment> }}
                />
                <MuiColorInput
                  label={ translate('registry.goals.input.color.title') }
                  fullWidth
                  isAlphaHidden
                  format="hex"
                  value={isHexColor(o.customizationBar.color) ? o.customizationBar.color : '#111111'}
                  onChange={(_, value) => updateCampaign(idx, 'customizationBar.color', isHexColor(value.hex) && value.hex.length > 0 ? value.hex : '#111111')} />
                <MuiColorInput
                  label={ translate('registry.goals.input.borderColor.title') }
                  fullWidth
                  isAlphaHidden
                  format="hex"
                  value={isHexColor(o.customizationBar.borderColor) ? o.customizationBar.borderColor : '#111111'}
                  onChange={(_, value) => updateCampaign(idx, 'customizationBar.borderColor', isHexColor(value.hex) && value.hex.length > 0 ? value.hex : '#111111')} />
                <MuiColorInput
                  label={ translate('registry.goals.input.backgroundColor.title') }
                  fullWidth
                  isAlphaHidden
                  format="hex"
                  value={isHexColor(o.customizationBar.backgroundColor) ? o.customizationBar.backgroundColor : '#111111'}
                  onChange={(_, value) => updateCampaign(idx, 'customizationBar.backgroundColor', isHexColor(value.hex) && value.hex.length > 0 ? value.hex : '#111111')} />
              </Stack>
            </AccordionDetails>
          </Accordion>

          <Button sx={{ py: 1.5 }} variant='contained' color='error' onClick={() => removeGoal(idx)}>Remove goal {idx + 1}</Button>
        </React.Fragment>)}
      </Stack>
    </Box>
  </>;
};