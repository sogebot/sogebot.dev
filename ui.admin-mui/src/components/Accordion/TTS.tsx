import { ExpandMoreTwoTone, LaunchTwoTone, PlayArrowTwoTone } from '@mui/icons-material';
import { Accordion, AccordionDetails, AccordionProps, AccordionSummary, Alert, Autocomplete, Chip, Fade, FormControl, FormLabel, IconButton, InputLabel, LinearProgress, MenuItem, Select, Slider, Stack, Switch, TextField, Typography } from '@mui/material';
import { Alerts, TTS, TTSService } from '@sogebot/backend/dest/database/entity/overlay';
import { Randomizer } from '@sogebot/backend/dest/database/entity/randomizer';
import match from 'autosuggest-highlight/match';
import parse from 'autosuggest-highlight/parse';
import axios from 'axios';
import React from 'react';
import { Link } from 'react-router-dom';

import { useAppSelector } from '../../hooks/useAppDispatch';
import { useTranslation } from '../../hooks/useTranslation';
import { useTTS } from '../../hooks/useTTS';
import theme from '../../theme';
import { TTSElevenLabs } from '../Settings/Core/tts/elevenlabs';
import { TTSGoogle } from '../Settings/Core/tts/google';
import { TTSResponsiveVoice } from '../Settings/Core/tts/responsivevoice';

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
  [TTSService.ELEVENLABS]: {
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

const serviceName = {
  [TTSService.NONE]: 'None',
  [TTSService.SPEECHSYNTHESIS]: 'Web Speech API',
  [TTSService.RESPONSIVEVOICE]: 'ResponsiveVoice',
  [TTSService.GOOGLE]: 'GoogleTTS',
  [TTSService.ELEVENLABS]: 'ElevenLabs',
};

const elevenLabsVoices: {
  [voice_id: string]: string,
} = {};

const getVoiceByValue = (service: TTSService, value: string) => {
  if (service === TTSService.ELEVENLABS) {
    for (const [ key, voice ] of Object.entries(elevenLabsVoices)) {
      if (voice === value) {
        return key;
      }
    }
    return value;
  } else {
    return value;
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

  const selectedValues = values[model.selectedService] ?? values[TTSService.NONE];
  const selectedService = model.services[model.selectedService];

  const isElevenLabsConfigured = 'elevenlabsApiKey' in configuration.core.tts && configuration.core.tts.elevenlabsApiKey !== '';
  const isResponsiveVoiceConfigured = configuration.core.tts.responsiveVoiceKey !== '';
  const isGoogleConfigured = configuration.core.tts.googlePrivateKey !== '';

  const isConfigurationValid = (model.selectedService === TTSService.ELEVENLABS && isElevenLabsConfigured)
    || (model.selectedService === TTSService.RESPONSIVEVOICE && isResponsiveVoiceConfigured)
    || (model.selectedService === TTSService.GOOGLE && isGoogleConfigured)
    || model.selectedService === TTSService.SPEECHSYNTHESIS;

  const getVoicesFromResponsiveVoice = async () => {
    await new Promise<void>(resolve => {
      const checkAvailability = () => {
        if (typeof window.responsiveVoice === 'undefined') {
          loadResponsiveVoice();
          setTimeout(() => checkAvailability(), 200);
          return;
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
      // workaround for speechSynthesis.getVoices() not returning voices on first call
      const speechSynthesisVoices = speechSynthesis.getVoices();
      if (speechSynthesisVoices.length > 0) {
        setVoices(speechSynthesisVoices.map(o => o.name));
        setLoading(false);
      } else {
        setTimeout(() => {
          setVoices(speechSynthesis.getVoices().map(o => o.name));
          setLoading(false);
        }, 1000);
      }
    }

    if (isElevenLabsConfigured) {
      if(model.selectedService === TTSService.ELEVENLABS) {
        (async function getVoicesFromElevenLabs() {
          const availableVoices = await axios.get('https://api.elevenlabs.io/v1/voices', {
            headers: {
              'xi-api-key': configuration.core.tts.elevenlabsApiKey,
            }
          });
          for (const voice of availableVoices.data.voices) {
            elevenLabsVoices[voice.name] = voice.voice_id;
          }
          setVoices(availableVoices.data.voices.map((o: { name: string }) => o.name));
          setLoading(false);
        })();
      }
    }
  }, [model.selectedService]);

  React.useEffect(() => {
    console.log('Setting voices to', voices);
  }, [ voices ]);

  React.useEffect(() => {
    const defaultValues = {
      [TTSService.NONE]: null,
      [TTSService.ELEVENLABS]: {
        voice: '',
        volume: 1,
        stability: 0.5,
        clarity: 0.75,
        exaggeration: 0,
      },
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

  const { speak, loadResponsiveVoice } = useTTS();

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
                  {model.selectedService in serviceName
                    ? serviceName[model.selectedService]
                    : 'unknown service'
                  }
                  {' '}
                  {model.selectedService !== TTSService.NONE && (getVoiceByValue(model.selectedService, selectedService?.voice ?? 'unknown voice'))}
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
            <MenuItem value={TTSService.RESPONSIVEVOICE}>
              {!isResponsiveVoiceConfigured && <Chip sx={{ mr: 1 }}variant='filled' color='error' size='small' label='not configured'/>}
              ResponsiveVoice
            </MenuItem>
            <MenuItem value={TTSService.GOOGLE}>
              {!isGoogleConfigured && <Chip sx={{ mr: 1 }}variant='filled' color='error' size='small' label='not configured'/>}
              GoogleTTS
            </MenuItem>
            <MenuItem value={TTSService.SPEECHSYNTHESIS}>Web Speech API</MenuItem>
            <MenuItem value={TTSService.ELEVENLABS}>
              {!isElevenLabsConfigured && <Chip sx={{ mr: 1 }}variant='filled' color='error' size='small' label='not configured'/>}
              ElevenLabs
            </MenuItem>
          </Select>
          {model.selectedService === TTSService.ELEVENLABS && isElevenLabsConfigured === false
            ? <TTSElevenLabs dialog/>
            : model.selectedService === TTSService.RESPONSIVEVOICE && isResponsiveVoiceConfigured === false
              ? <TTSResponsiveVoice dialog/>
              : model.selectedService === TTSService.GOOGLE && isGoogleConfigured === false
                ? <TTSGoogle dialog/>
                : loading && <LinearProgress/>}
        </FormControl>

        {(!loading && model.selectedService !== TTSService.NONE) && isConfigurationValid && <>
          {model.services[model.selectedService] !== undefined && <Autocomplete
            value={getVoiceByValue(model.selectedService, selectedService?.voice ?? '')}
            disableClearable
            onChange={(ev, value) => {
              let voice = value;
              if (model.selectedService === TTSService.ELEVENLABS) {
                voice = elevenLabsVoices[value] ?? value;
              }
              onChange({
                ...model,
                services: {
                  ...(model.services ?? {}),
                  [model.selectedService]: {
                    ...model.services[model.selectedService],
                    voice,
                  }
                }
              });
            }}
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

          {model.selectedService === TTSService.SPEECHSYNTHESIS && <Alert severity='warning'>
            There is currently bug at <Link to="https://github.com/obsproject/obs-browser/issues/404" target='_blank'>https://github.com/obsproject/obs-browser/issues/404<LaunchTwoTone sx={{ fontSize: '14px', position: 'relative', top: '2px' }}/></Link>, you need to <strong>disable audio via OBS</strong> on browser source to get this TTS service working.
          </Alert>}

          <Stack direction='row' spacing={2} alignItems="center" sx={{ padding: '25px 20px 0px 0' }}>
            <FormLabel sx={{ width: '170px' }}>{ translate('registry.alerts.volume') }</FormLabel>
            <Slider
              step={selectedValues.stepVolume}
              min={selectedValues.minVolume}
              max={selectedValues.maxVolume}
              valueLabelFormat={(val) => `${(Number(val * 100).toFixed(0))}${selectedValues.volumeAdornment}`}
              valueLabelDisplay="on"
              value={selectedService?.volume ?? 1}
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

          {('stepRate' in selectedValues && selectedService && 'rate' in selectedService) && <Stack direction='row' spacing={2} alignItems="center" sx={{ padding: '15px 20px 0px 0' }}>
            <FormLabel sx={{ width: '170px' }}>{ translate('registry.alerts.rate') }</FormLabel>
            <Slider
              step={selectedValues.stepRate}
              min={selectedValues.minRate}
              max={selectedValues.maxRate}
              valueLabelDisplay="on"
              value={selectedService?.rate ?? (selectedValues.maxRate - selectedValues.minRate) / 2}
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
          </Stack>}

          {('stepPitch' in selectedValues && selectedService && 'pitch' in selectedService) && <Stack direction='row' spacing={2} alignItems="center" sx={{ padding: '15px 20px 30px 0' }}>
            <FormLabel sx={{ width: '170px' }}>{ translate('registry.alerts.pitch') }</FormLabel>
            <Slider
              step={selectedValues.stepPitch}
              min={selectedValues.minPitch}
              max={selectedValues.maxPitch}
              valueLabelDisplay="on"
              value={selectedService?.pitch ?? (selectedValues.maxPitch - selectedValues.minPitch) / 2}
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
          </Stack>}

          {(selectedService && 'stability' in selectedService) && <Stack direction='row' spacing={2} alignItems="center" sx={{ padding: '25px 20px 0px 0' }}>
            <FormLabel sx={{ width: '170px' }}>Stability</FormLabel>
            <Slider
              step={selectedValues.stepVolume}
              min={selectedValues.minVolume}
              max={selectedValues.maxVolume}
              valueLabelFormat={(val) => `${(Number(val * 100).toFixed(0))}${selectedValues.volumeAdornment}`}
              valueLabelDisplay="on"
              value={selectedService?.stability ?? 1}
              onChange={(_, newValue) => onChange({
                ...model,
                services: {
                  ...(model.services ?? {}),
                  [model.selectedService]: {
                    ...model.services[model.selectedService],
                    stability: newValue,
                  }
                },
              })}/>
          </Stack>}

          {(selectedService && 'clarity' in selectedService) && <Stack direction='row' spacing={2} alignItems="center" sx={{ padding: '25px 20px 0px 0' }}>
            <FormLabel sx={{ width: '170px' }}>Clarity + Similarity Enhancement</FormLabel>
            <Slider
              step={selectedValues.stepVolume}
              min={selectedValues.minVolume}
              max={selectedValues.maxVolume}
              valueLabelFormat={(val) => `${(Number(val * 100).toFixed(0))}${selectedValues.volumeAdornment}`}
              valueLabelDisplay="on"
              value={selectedService?.clarity ?? 1}
              onChange={(_, newValue) => onChange({
                ...model,
                services: {
                  ...(model.services ?? {}),
                  [model.selectedService]: {
                    ...model.services[model.selectedService],
                    clarity: newValue,
                  }
                },
              })}/>
          </Stack>}

          {(selectedService && 'exaggeration' in selectedService) && <Stack direction='row' spacing={2} alignItems="center" sx={{ padding: '25px 20px 0px 0' }}>
            <FormLabel sx={{ width: '170px' }}>Style Exaggeration</FormLabel>
            <Slider
              step={selectedValues.stepVolume}
              min={selectedValues.minVolume}
              max={selectedValues.maxVolume}
              valueLabelFormat={(val) => `${(Number(val * 100).toFixed(0))}${selectedValues.volumeAdornment}`}
              valueLabelDisplay="on"
              value={selectedService?.exaggeration ?? 1}
              onChange={(_, newValue) => onChange({
                ...model,
                services: {
                  ...(model.services ?? {}),
                  [model.selectedService]: {
                    ...model.services[model.selectedService],
                    exaggeration: newValue,
                  }
                },
              })}/>
          </Stack>}

          {(selectedService && selectedService?.voice !== undefined) && <TextField
            value={text}
            variant='filled'
            fullWidth
            sx={{
              mt: 1,
            }}
            label={translate('registry.alerts.test')}
            onChange={(ev) => setText(ev.currentTarget.value)}
            InputProps={{ endAdornment: <IconButton onClick={() => {
              if (model.selectedService === TTSService.ELEVENLABS) {
                const service = model.services[model.selectedService]!;
                speak({
                  text,
                  service: model.selectedService,
                  stability: service.stability,
                  clarity: service.clarity,
                  volume: service.volume,
                  voice: service.voice,
                  exaggeration: service.exaggeration,
                });
              } else {
                const service = model.services[model.selectedService]!;
                speak({
                  text,
                  service: model.selectedService,
                  rate: service.rate,
                  pitch: service.pitch,
                  volume: service.volume,
                  voice: service.voice,
                });
              }
            }
            }><PlayArrowTwoTone/></IconButton> }}
          />}
        </>}
      </AccordionDetails>
    </Accordion>
  </>;
};