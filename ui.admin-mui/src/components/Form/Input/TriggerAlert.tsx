import {
  ClearTwoTone, ExpandMoreTwoTone, VolumeUpTwoTone,
} from '@mui/icons-material';
import {
  Collapse,
  Divider,
  Fade,
  FormControl,
  FormLabel, IconButton, InputAdornment, InputLabel, LinearProgress, ListSubheader, MenuItem, Select, Stack, Switch, TextField, Typography,
} from '@mui/material';
import { Alert } from '@sogebot/backend/dest/database/entity/alert';
import axios from 'axios';
import React, { useRef } from 'react';

import { AdditionalGridFormResponse } from './Response';
import getAccessToken from '../../../getAccessToken';
import theme from '../../../theme';
import layout1 from '../assets/layout1.png';
import layout2 from '../assets/layout2.png';
import layout3 from '../assets/layout3.png';
import layout4 from '../assets/layout4.png';
import layout5 from '../assets/layout5.png';

type Props = {
  value: any,
  idx: number,
  onChange?: (value: any) => void,
  disablePermission?: boolean,
  disableFilter?: boolean,
  disableExecution?: boolean,
};

const selectedItemRegex = /\$triggerAlert\((?<uuid>[0-9A-F]{8}(?:-[0-9A-F]{4}){3}-[0-9A-F]{12}),? ?(?<options>.*)?\)/mi;

export const FormTriggerAlert: React.FC<Props> = ({ value, onChange,
  disablePermission,
  disableFilter,
  disableExecution }) => {
  const [ alerts, setAlerts ] = React.useState<Alert[] | null>(null);
  const [ loading, setLoading ] = React.useState(true);
  const [ propsValue, setPropsValue ] = React.useState(value);

  const parsedResponse = (value.response as string).match(selectedItemRegex);
  const parsedOptions = parsedResponse?.groups && parsedResponse?.groups.options
    ? JSON.parse(Buffer.from(parsedResponse?.groups.options, 'base64').toString())
    : null;

  const [ selectedItemId, setSelectedItemId ] = React.useState<null | string>(parsedResponse?.groups ? parsedResponse.groups.uuid : null);
  const [ options, setOptions ] = React.useState<null | {
    volume?: number;
    alertDuration? : number;
    textDelay? : number;
    layout? : number;
    messageTemplate? : string;
    audioUrl? : string;
    mediaUrl? : string;
  }>(parsedOptions);

  const [ expand, setExpand ] = React.useState(false);
  const volumeRef = useRef<HTMLInputElement>();
  const alertDurationRef = useRef<HTMLInputElement>();
  const textDelayRef = useRef<HTMLInputElement>();
  const messageTemplateRef = useRef<HTMLInputElement>();
  const audioUrlRef = useRef<HTMLInputElement>();
  const mediaUrlRef = useRef<HTMLInputElement>();

  React.useEffect(() => {
    axios.get<Alert[]>(`${JSON.parse(localStorage.server)}/api/registries/alerts/`, { headers: { authorization: `Bearer ${getAccessToken()}` } })
      .then(res => setAlerts(res.data))
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => {
    if (onChange) {
      onChange({
        ...propsValue,
        response: options
          ? `$triggerAlert(${selectedItemId}, ${Buffer.from(JSON.stringify(options)).toString('base64')})`
          : `$triggerAlert(${selectedItemId})`,
      });
    }
  }, [ selectedItemId, options, propsValue ]);

  return <>
    <FormControl fullWidth variant="filled" >
      <InputLabel id="type-select-label" shrink>Custom alert overlay</InputLabel>
      <Select
        label="Custom alert overlay"
        labelId="type-select-label"
        value={selectedItemId}
        displayEmpty
        onChange={(ev) => setSelectedItemId(ev.target.value)}
      >
        <MenuItem value=''>Please select item</MenuItem>
        {alerts?.filter(o => o.items.filter(b => b.type === 'custom').length > 0).map(alert => ([
          <ListSubheader>{alert.name} <Typography variant='caption' component='small'>{alert.id}</Typography></ListSubheader>,
          ...alert.items.filter(o => o.type === 'custom').map(item => <MenuItem key={item.id} value={item.id}>
            {item.title} <Typography variant='caption' component='small'>{item.id}</Typography>
          </MenuItem>),
        ]))}
      </Select>
      <Fade in={loading}><LinearProgress /></Fade>
    </FormControl>

    <Collapse in={expand}>
      <Stack direction='row' spacing={1}>
        <TextField
          inputRef={volumeRef}
          fullWidth
          variant='filled'
          label="Volume"
          onKeyDown={(ev) => {
            const i = ev.shiftKey ? 10 : 1;
            if (ev.key === 'ArrowDown') {
              ev.preventDefault(); // disable accidental shiftkey selection
              setOptions(o => {
                const volume = Math.max((o?.volume ?? Number(volumeRef.current ? volumeRef.current!.value : 20)) - i, 0);
                const opts: NonNullable<typeof options> = o ?? {};
                return {
                  ...opts, volume,
                };
              });
            }
            if (ev.key === 'ArrowUp') {
              ev.preventDefault();  // disable accidental shiftkey selection
              setOptions(o => {
                const volume = Math.min((o?.volume ?? Number(volumeRef.current ? volumeRef.current!.value : 20)) + i, 100);
                const opts: NonNullable<typeof options> = o ?? {};
                return {
                  ...opts, volume,
                };
              });
            }
          }}
          value={options?.volume ?? (volumeRef.current ? volumeRef.current!.value : 20)}
          onChange={(ev) => {
            let val = Number(ev.target.value);
            if (!isNaN(val)) {
              if (val < 0) {
                val = 0;
              }
              if (val > 100) {
                val = 100;
              }
              setOptions(o => ({
                ...o, volume: val,
              }));
            }
          }}
          InputProps={{
            startAdornment: <>
              <InputAdornment position="start">
                <Switch size='small' checked={'volume' in (options ?? {})} onChange={(_, checked) => {
                  if (checked) {
                    setOptions(o => ({
                      ...(o ?? {}), volume: Number(volumeRef.current!.value),
                    }));
                  } else {
                    setOptions(o => {
                      const opts = o ?? {};
                      delete opts.volume;
                      if (Object.keys(opts).length === 0) {
                        return null;
                      }
                      return { ...opts };
                    });
                  }
                }}/>
              </InputAdornment>
            </>,
            endAdornment: <>
              <InputAdornment position="end">
            %
              </InputAdornment>
            </>,
          }}
        />
        <TextField
          inputRef={alertDurationRef}
          fullWidth
          variant='filled'
          label="Alert Duration"
          onKeyDown={(ev) => {
            const i = ev.shiftKey ? 10000 : 1000;
            if (ev.key === 'ArrowDown') {
              ev.preventDefault(); // disable accidental shiftkey selection
              setOptions(o => {
                const alertDuration = Math.max((o?.alertDuration ?? Number(alertDurationRef.current ? alertDurationRef.current!.value : 1000)) - i, 0);
                const opts: NonNullable<typeof options> = o ?? {};
                return {
                  ...opts, alertDuration,
                };
              });
            }
            if (ev.key === 'ArrowUp') {
              ev.preventDefault();  // disable accidental shiftkey selection
              setOptions(o => {
                const alertDuration = (o?.alertDuration ?? Number(alertDurationRef.current ? alertDurationRef.current!.value : 1000)) + i;
                const opts: NonNullable<typeof options> = o ?? {};
                return {
                  ...opts, alertDuration,
                };
              });
            }
          }}
          value={options?.alertDuration ?? (alertDurationRef.current ? alertDurationRef.current!.value : 1000)}
          onChange={(ev) => {
            let val = Number(ev.target.value);
            if (!isNaN(val)) {
              if (val < 0) {
                val = 0;
              }
              setOptions(o => ({
                ...o, alertDuration: val,
              }));
            }
          }}
          InputProps={{
            startAdornment: <>
              <InputAdornment position="start">
                <Switch  size='small' checked={'alertDuration' in (options ?? {})} onChange={(_, checked) => {
                  if (checked) {
                    setOptions(o => ({
                      ...(o ?? {}), alertDuration: Number(alertDurationRef.current!.value),
                    }));
                  } else {
                    setOptions(o => {
                      const opts = o ?? {};
                      delete opts.alertDuration;
                      if (Object.keys(opts).length === 0) {
                        return null;
                      }
                      return { ...opts };
                    });
                  }
                }}/>
              </InputAdornment>
            </>,
            endAdornment: <>
              <InputAdornment position="end">
            ms
              </InputAdornment>
            </>,
          }}
        />
        <TextField
          inputRef={textDelayRef}
          fullWidth
          variant='filled'
          label="Text delay"
          onKeyDown={(ev) => {
            const i = ev.shiftKey ? 10000 : 1000;
            if (ev.key === 'ArrowDown') {
              ev.preventDefault(); // disable accidental shiftkey selection
              setOptions(o => {
                const textDelay = Math.max((o?.textDelay ?? Number(textDelayRef.current ? textDelayRef.current!.value : 1000)) - i, 0);
                const opts: NonNullable<typeof options> = o ?? {};
                return {
                  ...opts, textDelay,
                };
              });
            }
            if (ev.key === 'ArrowUp') {
              ev.preventDefault();  // disable accidental shiftkey selection
              setOptions(o => {
                const textDelay = (o?.textDelay ?? Number(textDelayRef.current ? textDelayRef.current!.value : 1000)) + i;
                const opts: NonNullable<typeof options> = o ?? {};
                return {
                  ...opts, textDelay,
                };
              });
            }
          }}
          value={options?.textDelay ?? (textDelayRef.current ? textDelayRef.current!.value : 1000)}
          onChange={(ev) => {
            let val = Number(ev.target.value);
            if (!isNaN(val)) {
              if (val < 0) {
                val = 0;
              }
              setOptions(o => ({
                ...o, textDelay: val,
              }));
            }
          }}
          InputProps={{
            startAdornment: <>
              <InputAdornment position="start">
                <Switch  size='small' checked={'textDelay' in (options ?? {})} onChange={(_, checked) => {
                  if (checked) {
                    setOptions(o => ({
                      ...(o ?? {}), textDelay: Number(textDelayRef.current!.value),
                    }));
                  } else {
                    setOptions(o => {
                      const opts = o ?? {};
                      delete opts.textDelay;
                      if (Object.keys(opts).length === 0) {
                        return null;
                      }
                      return { ...opts };
                    });
                  }
                }}/>
              </InputAdornment>
            </>,
            endAdornment: <>
              <InputAdornment position="end">
            ms
              </InputAdornment>
            </>,
          }}
        />
      </Stack>

      <TextField
        inputRef={messageTemplateRef}
        fullWidth
        placeholder='Enter your customized message template'
        variant='filled'
        label="Message Template"
        value={options?.messageTemplate ?? (messageTemplateRef.current ? messageTemplateRef.current!.value : '')}
        onChange={(ev) => {
          const val = ev.target.value;
          setOptions(o => ({
            ...o, messageTemplate: val,
          }));
        }}
        InputProps={{
          startAdornment: <>
            <InputAdornment position="start">
              <Switch  size='small' checked={'messageTemplate' in (options ?? {})} onChange={(_, checked) => {
                if (checked) {
                  setOptions(o => ({
                    ...(o ?? {}), messageTemplate: messageTemplateRef.current!.value,
                  }));
                } else {
                  setOptions(o => {
                    const opts = o ?? {};
                    delete opts.messageTemplate;
                    if (Object.keys(opts).length === 0) {
                      return null;
                    }
                    return { ...opts };
                  });
                }
              }}/>
            </InputAdornment>
          </>,
        }}
      />

      <TextField
        inputRef={audioUrlRef}
        fullWidth
        placeholder='Enter your customized audio url'
        variant='filled'
        label="Audio URL"
        value={options?.audioUrl ?? (audioUrlRef.current ? audioUrlRef.current!.value : '')}
        onChange={(ev) => {
          const val = ev.target.value;
          setOptions(o => ({
            ...o, audioUrl: val,
          }));
        }}
        InputProps={{
          startAdornment: <>
            <InputAdornment position="start">
              <Switch  size='small' checked={'audioUrl' in (options ?? {})} onChange={(_, checked) => {
                if (checked) {
                  setOptions(o => ({
                    ...(o ?? {}), audioUrl: audioUrlRef.current!.value,
                  }));
                } else {
                  setOptions(o => {
                    const opts = o ?? {};
                    delete opts.audioUrl;
                    if (Object.keys(opts).length === 0) {
                      return null;
                    }
                    return { ...opts };
                  });
                }
              }}/>
            </InputAdornment>
          </>,
        }}
      />

      <TextField
        inputRef={mediaUrlRef}
        fullWidth
        placeholder='Enter your customized image/video url'
        variant='filled'
        label="Image/Video URL"
        value={options?.mediaUrl ?? (mediaUrlRef.current ? mediaUrlRef.current!.value : '')}
        onChange={(ev) => {
          const val = ev.target.value;
          setOptions(o => ({
            ...o, mediaUrl: val,
          }));
        }}
        InputProps={{
          startAdornment: <>
            <InputAdornment position="start">
              <Switch  size='small' checked={'mediaUrl' in (options ?? {})} onChange={(_, checked) => {
                if (checked) {
                  setOptions(o => ({
                    ...(o ?? {}), mediaUrl: mediaUrlRef.current!.value,
                  }));
                } else {
                  setOptions(o => {
                    const opts = o ?? {};
                    delete opts.mediaUrl;
                    if (Object.keys(opts).length === 0) {
                      return null;
                    }
                    return { ...opts };
                  });
                }
              }}/>
            </InputAdornment>
          </>,
        }}
      />

      <Stack direction='row' alignItems='center' spacing={0.5}>
        <FormLabel sx={{ width: '170px' }}>Layout</FormLabel>
        <IconButton sx={{
          borderRadius: 0, backgroundColor: !options || !('layout' in options) ? `${theme.palette.primary.main}55` : undefined,
        }} onClick={() => {
          setOptions(o => {
            const opts = o ?? {};
            delete opts.layout;
            if (Object.keys(opts).length === 0) {
              return null;
            }
            return { ...opts };
          });
        }}>
          <ClearTwoTone sx={{
            fontSize: '50px', color: 'grey',
          }}/>
        </IconButton>
        <IconButton sx={{
          borderRadius: 0, backgroundColor: options && options.layout === 0 ? `${theme.palette.primary.main}55` : undefined,
        }} onClick={() => {
          setOptions(o => ({
            ...o, layout: 0,
          }));
        }}>
          <VolumeUpTwoTone sx={{ fontSize: '50px' }}/>
        </IconButton>

        <IconButton sx={{
          borderRadius: 0, backgroundColor: options && options.layout === 1 ? `${theme.palette.primary.main}55` : undefined,
        }} onClick={() => {
          setOptions(o => ({
            ...o, layout: 1,
          }));
        }}><img width={50} src={layout1} title="Text below image"/></IconButton>

        <IconButton sx={{
          borderRadius: 0, backgroundColor: options && options.layout === 2 ? `${theme.palette.primary.main}55` : undefined,
        }} onClick={() => {
          setOptions(o => ({
            ...o, layout: 2,
          }));
        }}><img width={50} src={layout2} title="Text above image"/></IconButton>

        <IconButton sx={{
          borderRadius: 0, backgroundColor: options && options.layout === 3 ? `${theme.palette.primary.main}55` : undefined,
        }} onClick={() => {
          setOptions(o => ({
            ...o, layout: 3,
          }));
        }}><img width={50} src={layout3} title="Text inside image"/></IconButton>

        <IconButton sx={{
          borderRadius: 0, backgroundColor: options && options.layout === 4 ? `${theme.palette.primary.main}55` : undefined,
        }} onClick={() => {
          setOptions(o => ({
            ...o, layout: 4,
          }));
        }}><img width={50} src={layout4} title="Text on left side of image"/></IconButton>

        <IconButton sx={{
          borderRadius: 0, backgroundColor: options && options.layout === 5 ? `${theme.palette.primary.main}55` : undefined,
        }} onClick={() => {
          setOptions(o => ({
            ...o, layout: 5,
          }));
        }}><img width={50} src={layout5} title="Text on right side of image"/></IconButton>
      </Stack>
    </Collapse>
    <Divider onClick={() => setExpand(!expand)} sx={{
      position: 'relative', zIndex: 9999,
    }}>
      <ExpandMoreTwoTone sx={{
        transform: expand ? 'rotate(-180deg)' : '', position: 'relative', top: '5px', transition: 'all 250ms',
      }}/>
      <Typography variant='overline' component='span' sx={{
        display: 'inline-block', width: '200px',
      }}>
        {expand ? 'Collapse' : 'Expand'} options
      </Typography>
      <ExpandMoreTwoTone sx={{
        transform: expand ? 'rotate(180deg)' : '', position: 'relative', top: '5px', transition: 'all 250ms',
      }}/>
    </Divider>

    <AdditionalGridFormResponse disableExecution={disableExecution} disableFilter={disableFilter} disablePermission={disablePermission} value={propsValue} onChange={setPropsValue}/>
  </>;
};