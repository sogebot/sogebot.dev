import {
  Box, Button, FormControl, FormHelperText, InputAdornment,
  InputLabel, MenuItem, Select, Stack, TextField, Typography,
} from '@mui/material';
import { Goal } from '@sogebot/backend/dest/database/entity/overlay';
import React from 'react';

import { useTranslation } from '../../../hooks/useTranslation';
import { FormNumericInput } from '../Input/Numeric';

type Props = {
  model: Goal;
  onUpdate: (value: Goal) => void;
};

export const GoalSettings: React.FC<Props> = ({ onUpdate, model }) => {
  const { translate } = useTranslation();

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
        family:      'PT Sans',
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
        + '\n\t\tBootstrap classes are available'
        + '\n\t\tAvailable variables:'
          + '\n\t\t\t$name - name of goal ; $type - type of goal ; $goalAmount - total amount'
          + '\n\t\t\t$currentAmount - current amount ; $percentageAmount - how much is achieved ; $endAfter - when goal ends'
      + '\n\t-->'
      + '\n'
      + '\n\t<div class="row no-gutters">'
        + '\n\t\t<div class="col-4 text-left text-nowrap pl-2 pr-2">$name</div>'
        + '\n\t\t<div class="col-4 text-nowrap text-center">$currentAmount</div>'
        + '\n\t\t<div class="col-4 text-nowrap text-right pr-2">$goalAmount</div>'
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

  const updateCampaign = <ATTR extends keyof typeof model.campaigns[number]>(idx: number, attr: ATTR, value: typeof model.campaigns[number][ATTR]) => {
    model.campaigns[idx][attr] = value;
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
          min={1000}
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
          <Typography variant='h5'>Goal {idx+1}</Typography>
          <TextField
            label={translate('name')}
            fullWidth
            variant="filled"
            defaultValue={o.name}
            onChange={(ev) => updateCampaign(idx, 'name', ev.currentTarget.value ?? '')}
          />
          {JSON.stringify(o)}
        </React.Fragment>)}
      </Stack>
    </Box>
  </>;
};