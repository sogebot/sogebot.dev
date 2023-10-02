import { ExpandMoreTwoTone, PlayArrowTwoTone } from '@mui/icons-material';
import {
  Accordion, AccordionDetails, AccordionProps, AccordionSummary, Autocomplete, Fade, FormLabel, IconButton, Link, Slider, Stack, Switch, Typography,
} from '@mui/material';
import TextField from '@mui/material/TextField';
import { Alert } from '@sogebot/backend/dest/database/entity/alert';
import { TTS } from '@sogebot/backend/dest/database/entity/overlay';
import { Randomizer } from '@sogebot/backend/dest/database/entity/randomizer';
import { Alerts } from '@sogebot/backend/src/database/entity/overlay';
import match from 'autosuggest-highlight/match';
import parse from 'autosuggest-highlight/parse';
import React from 'react';
import { Helmet } from 'react-helmet';

import { getSocket } from '../../helpers/socket';
import { useAppSelector } from '../../hooks/useAppDispatch';
import { useTranslation } from '../../hooks/useTranslation';
import theme from '../../theme';

declare global {
  interface Window {
    responsiveVoice: any;
  }
}

type model = Randomizer['tts'] | TTS | Alerts['tts'];

type Props = Omit<AccordionProps, 'children' | 'onChange'> & {
  model: model,
  open: string,
  onOpenChange: (value: string) => void;
  onChange: (value: any) => void;
  alwaysShowLabelDetails?: boolean;
  prepend?: React.ReactNode;
  customLabelDetails?: React.ReactNode;
};

function isGlobal (value: Partial<Alert['items'][number]['tts']> | Required<Alert['tts']>): value is Required<Alert['tts']> {
  if (value) {
    return Object.keys(value).includes('voice');
  } else {
    return false;
  }
}

export const AccordionTTS: React.FC<Props> = (props) => {
  const accordionId = 'tts';
  const { open,
    onOpenChange,
    onChange,
    model,
    ...accordionProps } = props;
  const { translate } = useTranslation();
  const { configuration } = useAppSelector(state => state.loader);

  const service = React.useMemo(() => configuration.core.tts.service as -1 | 0 | 1, [ configuration ]);
  const [ voices, setVoices ] = React.useState<string[]>([]);
  const [ text, setText ] = React.useState('This message should be said by TTS to test your settings.');
  const isConfigured = React.useMemo(() => {
    if (configuration.core.tts.service === -1
      || (configuration.core.tts.service === 0 && configuration.core.tts.responsiveVoiceKey.length === 0)
      || (configuration.core.tts.service === 1 && (configuration.core.tts.googlePrivateKey.length === 0))) {
      return false;
    }
    return true;
  }, [ configuration]);

  const handleClick = () => {
    onOpenChange(open === accordionId ? '' : accordionId);
  };

  const getVoicesFromResponsiveVoice = () => {
    if (typeof window.responsiveVoice === 'undefined') {
      setTimeout(() => getVoicesFromResponsiveVoice(), 200);
      return;
    }
    window.responsiveVoice.init();
    setVoices(window.responsiveVoice.getVoices().map((o: { name: string }) => o.name));
  };

  React.useEffect(() => {
    if (voices.length === 0) {
      // voices not loaded yet
      return;
    }
    // check if voice is in list
    if (!voices.includes(model.voice)) {
      console.log('Voice', model.voice, 'not in list, setting to default');
      onChange({
        ...model, voice: voices.find(o => o.toLowerCase().startsWith('en-us-standard') || o.toLowerCase().startsWith('english')),
      });
    }
  }, [voices, model.voice ]);

  React.useEffect(() => {
    if (service === 0) {
      getVoicesFromResponsiveVoice();
      if (model.voice === '') {
        onChange({
          ...model, voice: 'English Female',
        });
      }
    }
    if (service === 1) {
      setVoices(configuration.core.tts.googleVoices);
      if (model.voice === '') {
        onChange({
          ...model, voice: 'en-US-Standard-A',
        });
      }
    }
  }, [open, service, configuration]);

  const speak = React.useCallback(async () => {
    for (const toSpeak of text.split('/ ')) {
      await new Promise<void>((resolve) => {
        if (toSpeak.trim().length === 0) {
          setTimeout(() => resolve(), 500);
        } else {
          if (isGlobal(model) && model) {
            if (service === 0) {
              window.responsiveVoice.speak(toSpeak.trim(), model.voice, {
                rate: model.rate, pitch: model.pitch, volume: Math.min(model.volume, 1), onend: () => setTimeout(() => resolve(), 500),
              });
            } else {
              // Google TTS
              getSocket('/core/tts').emit('google::speak', {
                rate: model.rate, pitch: model.pitch, volume: Math.min(model.volume, 1), voice: model.voice, text: text,
              }, (err, b64mp3) => {
                console.log({ b64mp3 });
                if (err) {
                  console.error(err);
                }
                const snd = new Audio(`data:audio/mp3;base64,` + b64mp3);
                snd.play();
              });
            }
          } else {
            console.error('You should not see this message, speak should be disabled in this extension panel - please log a bug');
          }
        }
      });
    }
  }, [ text, service, model ]);

  return <>
    <Helmet>
      {configuration.core.tts.responsiveVoiceKey.length > 0 && <script src={`https://code.responsivevoice.org/responsivevoice.js?key=${configuration.core.tts.responsiveVoiceKey}`}></script>}
    </Helmet>
    <Accordion {...accordionProps} disabled={props.disabled} expanded={open === accordionId && !props.disabled && isConfigured}>
      <AccordionSummary
        expandIcon={isConfigured && <ExpandMoreTwoTone />}
        onClick={() => handleClick()}
        aria-controls="panel1a-content"
        id="panel1a-header"
        sx={{ backgroundColor: !isConfigured ? theme.palette.error.dark : undefined }}
      >
        {isConfigured ? <>
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
                  : model.voice
                }
              </Typography>
            </Fade>
          </Typography>
        </> : <Typography>
        TTS is not properly set, go to{' '}<Link href="/settings/modules/core/tts">{' '}TTS settings</Link> and configure.
        </Typography>}
      </AccordionSummary>
      <AccordionDetails>
        {props.prepend && props.prepend}

        {model.voice !== undefined && <Autocomplete
          value={model.voice}
          disableClearable
          onChange={(ev, value) => onChange({
            ...model, voice: value as typeof model.voice,
          })}
          disablePortal
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

        <Stack direction='row' spacing={2} alignItems="center" sx={{ padding: '25px 20px 0px 0' }}>
          <FormLabel sx={{ width: '170px' }}>{ translate('registry.alerts.volume') }</FormLabel>
          <Slider
            step={0.01}
            min={0}
            max={1}
            valueLabelFormat={(val) => `${Number(val * 100).toFixed(0)}%`}
            valueLabelDisplay="on"
            value={model.volume}
            onChange={(_, newValue) => onChange({
              ...model, volume: newValue as number,
            })}/>
        </Stack>

        <Stack direction='row' spacing={2} alignItems="center" sx={{ padding: '15px 20px 0px 0' }}>
          <FormLabel sx={{ width: '170px' }}>{ translate('registry.alerts.rate') }</FormLabel>
          <Slider
            step={0.01}
            min={0}
            max={service === 0 ? 1.5 : 4.0}
            valueLabelDisplay="on"
            value={model.rate}
            onChange={(_, newValue) => onChange({
              ...model, rate: newValue as number,
            })}/>
        </Stack>

        <Stack direction='row' spacing={2} alignItems="center" sx={{ padding: '15px 20px 30px 0' }}>
          <FormLabel sx={{ width: '170px' }}>{ translate('registry.alerts.pitch') }</FormLabel>
          <Slider
            step={service === 0 ? 0.1 : 1}
            min={service === 0 ? 0.0 : -20.0}
            max={service === 0 ? 2.0 : 20.0}
            valueLabelDisplay="on"
            value={model.pitch}
            onChange={(_, newValue) => onChange({
              ...model, pitch: newValue as number,
            })}/>
        </Stack>

        {model.voice !== undefined && <TextField
          value={text}
          variant='filled'
          fullWidth
          label={translate('registry.alerts.test')}
          onChange={(ev) => setText(ev.currentTarget.value)}
          InputProps={{ endAdornment: <IconButton onClick={speak}><PlayArrowTwoTone/></IconButton> }}
        />}
      </AccordionDetails>
    </Accordion>
  </>;
};