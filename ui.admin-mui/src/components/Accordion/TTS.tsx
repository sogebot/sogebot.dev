import { ExpandMoreTwoTone, PlayArrowTwoTone } from '@mui/icons-material';
import { Accordion, AccordionDetails, AccordionProps, AccordionSummary, Alert, Autocomplete, Fade, FormControl, FormLabel, IconButton, InputLabel, MenuItem, Select, Slider, Stack, Switch, TextField, Typography } from '@mui/material';
import { Alerts, TTS, TTSService } from '@sogebot/backend/dest/database/entity/overlay';
import { Randomizer } from '@sogebot/backend/dest/database/entity/randomizer';
import match from 'autosuggest-highlight/match';
import parse from 'autosuggest-highlight/parse';
import React from 'react';

import { useAppSelector } from '../../hooks/useAppDispatch';
import { useTranslation } from '../../hooks/useTranslation';
import { useTTS } from '../../hooks/useTTS';
import theme from '../../theme';

declare global {
  interface Window {
    responsiveVoice: any;
  }
}

type Props = Omit<AccordionProps, 'children' | 'onChange'> & {
  model:                   Alerts['tts'] | TTS | Randomizer['tts']
  open:                    string,
  onOpenChange:            (value: string) => void;
  onChange:                (value: any) => void;
  alwaysShowLabelDetails?: boolean;
  prepend?:                React.ReactNode;
  customLabelDetails?:     React.ReactNode;
};

const values = {
  [TTSService.NONE]: {
    minRate: 0,
    maxRate: 1.5,
    stepRate: 0.01,
    maxPitch: 2.0,
    minPitch: 0.0,
    stepPitch: 0.1,
    maxVolume: 1,
    minVolume: 0,
    stepVolume: 0.01,
    volumeAdornment: '%',
  },
  [TTSService.SPEECHSYNTHESIS]: {
    minRate: 0,
    maxRate: 1.5,
    stepRate: 0.01,
    maxPitch: 2.0,
    minPitch: 0.0,
    stepPitch: 0.1,
    maxVolume: 1,
    minVolume: 0,
    stepVolume: 0.01,
    volumeAdornment: '%',
  },
  [TTSService.RESPONSIVEVOICE]: {
    minRate: 0,
    maxRate: 1.5,
    stepRate: 0.01,
    maxPitch: 2.0,
    minPitch: 0.0,
    stepPitch: 0.1,
    maxVolume: 1,
    minVolume: 0,
    stepVolume: 0.01,
    volumeAdornment: '%',
  },
  [TTSService.GOOGLE]:          {
    minRate: 0.25,
    maxRate: 4.0,
    stepRate: 0.01,
    maxPitch: 20.0,
    minPitch: -20.0,
    stepPitch: 1.0,
    maxVolume: 1,
    minVolume: 0,
    stepVolume: 0.01,
    volumeAdornment: '%',
  }
};

export const AccordionTTS: React.FC<Props> = (props) => {
  const accordionId = 'tts';
  const { open,
    onOpenChange,
    onChange,
    model,
    ...accordionProps } = props;
  const { translate } = useTranslation();
  const { configuration } = useAppSelector(state => state.loader);

  const [ voices, setVoices ] = React.useState<string[]>([]);
  const [ text, setText ] = React.useState('This message should be said by TTS to test your settings.');

  const handleClick = () => {
    onOpenChange(open === accordionId ? '' : accordionId);
  };

  const getVoicesFromResponsiveVoice = async () => {
    await new Promise<void>(resolve => {
      const checkAvailability = () => {
        if (typeof window.responsiveVoice === 'undefined') {
          setTimeout(() => checkAvailability(), 200);
        }
        resolve();
      };
      checkAvailability();
    });

    try {
      window.responsiveVoice.init();
    } catch (e) {
      console.warn(e);
    }
    setVoices(window.responsiveVoice.getVoices().map((o: { name: string }) => o.name));
  };

  const [ loading, setLoading ] = React.useState(true);
  React.useEffect(() => {
    setLoading(model.selectedService !== TTSService.NONE);
    if (model.selectedService === TTSService.RESPONSIVEVOICE) {
      console.log('Loading ResponsiveVoice voices');
      getVoicesFromResponsiveVoice().then(() => setLoading(false));
    }

    if(model.selectedService === TTSService.GOOGLE) {
      setVoices(configuration.core.tts.googleVoices);
      setLoading(false);
    }

    if(model.selectedService === TTSService.SPEECHSYNTHESIS) {
      setVoices(speechSynthesis.getVoices().map(o => o.name));
      setLoading(false);
    }
  }, [model.selectedService]);

  React.useEffect(() => {
    const defaultValues = {
      [TTSService.NONE]: null,
      [TTSService.SPEECHSYNTHESIS]: {
        voice: 'Microsoft David - English (United States)',
        rate: 1,
        pitch: 1,
        volume: 1,
      },
      [TTSService.RESPONSIVEVOICE]: {
        voice: 'UK English Female',
        rate: 1,
        pitch: 1,
        volume: 1,
      },
      [TTSService.GOOGLE]: {
        voice: 'en-US-Standard-A',
        rate: 1,
        pitch: 1,
        volume: 1,
      }
    };
    if (loading === false) {
      if (!(model.selectedService in model.services)) {
        console.log('Setting default values for', model.selectedService);
        model.services[model.selectedService as '1'] = defaultValues[model.selectedService as '1'];
      }
    }
    // on load finish, we need to check values of selectedService and set default values
  }, [loading, model]);

  const { speak } = useTTS();

  return <>
    <Accordion {...accordionProps} disabled={props.disabled} expanded={open === accordionId && !props.disabled}>
      <AccordionSummary
        expandIcon={<ExpandMoreTwoTone />}
        onClick={() => handleClick()}
        aria-controls="panel1a-content"
        id="panel1a-header"
      >
        {'enabled' in model && <Switch
          size='small'
          sx={{ mr: 1 }}
          checked={model.enabled}
          onClick={ev => ev.stopPropagation()}
          onChange={(_, val) => onChange({
            ...model, enabled: val,
          }) }/>}

        <Typography sx={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', width: '100%',
        }}>
          { translate('registry.alerts.tts.setting') }
          <Fade in={open !== accordionId || props.alwaysShowLabelDetails}>
            <Typography component='span' variant='caption' sx={{ textAlign: 'right' }}>
              {props.customLabelDetails
                ? props.customLabelDetails
                : <>
                  {model.selectedService === TTSService.NONE ? 'None'
                    : model.selectedService === TTSService.RESPONSIVEVOICE ? 'ResponsiveVoice'
                      : model.selectedService === TTSService.GOOGLE ? 'GoogleTTS'
                        : model.selectedService === TTSService.SPEECHSYNTHESIS ? 'Web Speech API'
                          : 'unknown service'
                  }
                  {' '}
                  {model.selectedService !== TTSService.NONE && (model.services[model.selectedService]?.voice ?? 'unknown voice')}
                </>
              }
            </Typography>
          </Fade>
        </Typography>

      </AccordionSummary>
      <AccordionDetails>
        {props.prepend && props.prepend}

        <FormControl fullWidth variant="filled" >
          <InputLabel id="service-label">Service</InputLabel>
          <Select
            MenuProps={{ PaperProps: { sx: { maxHeight: 200 } } }}
            label="Service"
            labelId="service-label"
            value={model.selectedService}
            onChange={(ev) => onChange({
              ...model, selectedService: ev.target.value as typeof model.selectedService,
            })}
          >
            <MenuItem value={TTSService.NONE}>None</MenuItem>
            <MenuItem value={TTSService.RESPONSIVEVOICE}>ResponsiveVoice</MenuItem>
            <MenuItem value={TTSService.GOOGLE}>GoogleTTS</MenuItem>
            <MenuItem value={TTSService.SPEECHSYNTHESIS}>Web Speech API</MenuItem>
          </Select>
        </FormControl>

        {!loading && model.selectedService !== TTSService.NONE && <>
          {model.services[model.selectedService] !== undefined && <Autocomplete
            value={model.services[model.selectedService]?.voice ?? ''}
            disableClearable
            onChange={(ev, value) => onChange({
              ...model,
              services: {
                ...(model.services ?? {}),
                [model.selectedService]: {
                  ...model.services[model.selectedService],
                  voice: value,
                }
              }
            })}
            id="registry.alerts.voice"
            options={voices}
            renderInput={(params) => <TextField {...params} label={translate('registry.alerts.voice')} />}
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

          {model.selectedService === TTSService.SPEECHSYNTHESIS && <Alert severity='info'>
            If you are running overlay on different computer, please check if voices are available on that machine as well.
          </Alert>}

          <Stack direction='row' spacing={2} alignItems="center" sx={{ padding: '25px 20px 0px 0' }}>
            <FormLabel sx={{ width: '170px' }}>{ translate('registry.alerts.volume') }</FormLabel>
            <Slider
              step={values[model.selectedService].stepVolume}
              min={values[model.selectedService].minVolume}
              max={values[model.selectedService].maxVolume}
              valueLabelFormat={(val) => `${(Number(val * 100).toFixed(0))}${values[model.selectedService].volumeAdornment}`}
              valueLabelDisplay="on"
              value={model.services[model.selectedService]?.volume ?? 1}
              onChange={(_, newValue) => onChange({
                ...model,
                services: {
                  ...(model.services ?? {}),
                  [model.selectedService]: {
                    ...model.services[model.selectedService],
                    volume: newValue,
                  }
                },
              })}/>
          </Stack>

          <Stack direction='row' spacing={2} alignItems="center" sx={{ padding: '15px 20px 0px 0' }}>
            <FormLabel sx={{ width: '170px' }}>{ translate('registry.alerts.rate') }</FormLabel>
            <Slider
              step={values[model.selectedService].stepRate}
              min={values[model.selectedService].minRate}
              max={values[model.selectedService].maxRate}
              valueLabelDisplay="on"
              value={model.services[model.selectedService]?.rate ?? (values[model.selectedService].maxRate - values[model.selectedService].minRate) / 2}
              onChange={(_, newValue) => onChange({
                ...model,
                services: {
                  ...(model.services ?? {}),
                  [model.selectedService]: {
                    ...model.services[model.selectedService],
                    rate: newValue,
                  }
                },
              })}/>
          </Stack>

          <Stack direction='row' spacing={2} alignItems="center" sx={{ padding: '15px 20px 30px 0' }}>
            <FormLabel sx={{ width: '170px' }}>{ translate('registry.alerts.pitch') }</FormLabel>
            <Slider
              step={values[model.selectedService].stepPitch}
              min={values[model.selectedService].minPitch}
              max={values[model.selectedService].maxPitch}
              valueLabelDisplay="on"
              value={model.services[model.selectedService]?.pitch ?? (values[model.selectedService].maxPitch - values[model.selectedService].minPitch) / 2}
              onChange={(_, newValue) => onChange({
                ...model,
                services: {
                  ...(model.services ?? {}),
                  [model.selectedService]: {
                    ...model.services[model.selectedService],
                    pitch: newValue,
                  }
                },
              })}/>
          </Stack>

          {model.services[model.selectedService]?.voice !== undefined && <TextField
            value={text}
            variant='filled'
            fullWidth
            label={translate('registry.alerts.test')}
            onChange={(ev) => setText(ev.currentTarget.value)}
            InputProps={{ endAdornment: <IconButton onClick={() => speak({
              text,
              service: model.selectedService,
              rate: model.services[model.selectedService]!.rate,
              pitch: model.services[model.selectedService]!.pitch,
              volume: model.services[model.selectedService]!.volume,
              voice: model.services[model.selectedService]!.voice,
            })}><PlayArrowTwoTone/></IconButton> }}
          />}

        </>}
      </AccordionDetails>
    </Accordion>
  </>;
};