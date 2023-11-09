import { ClearTwoTone, ExpandMoreTwoTone, VolumeUpTwoTone } from '@mui/icons-material';
import { Alert as AlertElement, Collapse, Divider, Fade, FormControl, FormLabel, IconButton, InputAdornment, InputLabel, LinearProgress, ListSubheader, MenuItem, Select, Stack, Switch, TextField, Typography } from '@mui/material';
import { Alert, EmitData } from '@sogebot/backend/dest/database/entity/alert';
import { Alerts } from '@sogebot/backend/dest/database/entity/overlay';
import { Overlay } from '@sogebot/backend/src/database/entity/overlay';
import axios from 'axios';
import React, { useRef } from 'react';

import { AdditionalGridFormResponse } from './Response';
import getAccessToken from '../../../getAccessToken';
import { getSocket } from '../../../helpers/socket';
import theme from '../../../theme';
import layout1 from '../assets/layout1.png';
import layout2 from '../assets/layout2.png';
import layout3 from '../assets/layout3.png';
import layout4 from '../assets/layout4.png';
import layout5 from '../assets/layout5.png';
import { FormSelectorGallery } from '../Selector/Gallery';

type Props = {
  value:              any,
  idx:                number,
  onChange?:          (value: any) => void,
  disablePermission?: boolean,
  disableFilter?:     boolean,
  disableExecution?:  boolean,
};

const selectedItemRegex = /\$triggerAlert\((?<uuid>[0-9A-F]{8}(?:-[0-9A-F]{4}){3}-[0-9A-F]{12}),? ?(?<options>.*)?\)/mi;

export const FormTriggerAlert: React.FC<Props> = ({ value, onChange,
  disablePermission,
  disableFilter,
  disableExecution }) => {
  const [ alerts, setAlerts ] = React.useState<Alert[] | null>(null);
  const [ overlays, setOverlays ] = React.useState<Overlay[]>([]);

  const [ loading, setLoading ] = React.useState(true);
  const [ propsValue, setPropsValue ] = React.useState(value);

  const parsedResponse = (value.response as string).match(selectedItemRegex);
  const parsedOptions = parsedResponse?.groups && parsedResponse?.groups.options
    ? JSON.parse(Buffer.from(parsedResponse?.groups.options, 'base64').toString())
    : null;

  const [ selectedItemId, setSelectedItemId ] = React.useState<null | string>(parsedResponse?.groups ? parsedResponse.groups.uuid : null);
  const [ options, setOptions ] = React.useState<null | EmitData['customOptions']>(parsedOptions);

  const [ expand, setExpand ] = React.useState(false);
  const alertDurationRef = useRef<HTMLInputElement>();
  const textDelayRef = useRef<HTMLInputElement>();
  const messageTemplateRef = useRef<HTMLInputElement>();

  React.useEffect(() => {
    axios.get<Alert[]>(`${JSON.parse(localStorage.server)}/api/registries/alerts/`, { headers: { authorization: `Bearer ${getAccessToken()}` } })
      .then(res => setAlerts(res.data))
      .finally(() => setLoading(false));

    getSocket('/registries/overlays').emit('generic::getAll', (err, data) => {
      if (err) {
        console.error(err);
      } else {
        // filter data to overlays only with alert item with custom hook
        setOverlays(data.filter((o) => {
          // first check if there is any alert item
          const itemsWithAlerts = o.items.filter(b => b.opts.typeId === 'alerts');
          if (itemsWithAlerts.length === 0) {
            return false;
          }
          // second check if alert item contains custom hook
          const containsCustomHook = itemsWithAlerts.filter(b => (b.opts as Alerts).items.filter(c => c.hooks[0] === 'custom'));
          return containsCustomHook.length > 0;
        }));
      }
    });
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

  const getAllVariantsOfAlertItems = (items: Alerts['items']) => {
    const variants = [];
    for (const item of items) {
      if (item.hooks[0] === 'custom') {
        item.variantName ??= 'Main';
        // add main variant
        variants.push(item);
        // add sub variants
        let idx = 1;
        for (const variant of item.variants) {
          variant.variantName ??= 'Variant ' + idx;
          variants.push(variant);
          idx++;
        }
      }
    }
    return variants;
  };

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
            <Typography sx={{ fontWeight: 'bold' }} component='span'>
              {item.title}

              <Typography sx={{
                fontWeight: 'normal', fontSize: '12px', fontStyle: 'italic', pl: 1,
              }} component='span'>
                {item.id}
              </Typography>
            </Typography>
          </MenuItem>),
        ]))}
        {overlays.map(overlay => ([
          <ListSubheader>{overlay.name} <Typography variant='caption' component='small'>{overlay.id}</Typography></ListSubheader>,
          ...overlay.items.filter(o => o.opts.typeId === 'alerts')
            .map(item => getAllVariantsOfAlertItems((item.opts as Alerts).items)
              .map(o => <MenuItem key={o.id} value={o.id}>
                <Typography sx={{ fontWeight: 'bold' }} component='span'>
                  {o.variantName}

                  <Typography sx={{
                    fontWeight: 'normal', fontSize: '12px', fontStyle: 'italic', pl: 1,
                  }} component='span'>
                    {o.id}
                  </Typography>
                </Typography>
              </MenuItem>),
            ),
        ]))}
      </Select>
      <Fade in={loading}><LinearProgress /></Fade>
    </FormControl>

    <AlertElement severity='error'>
      You are using soon to be deprecated alerts registry, please update to alerts overlays
    </AlertElement>

    <Collapse in={expand}>
      <Stack direction='row' spacing={1}>
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

      <FormSelectorGallery
        label="Media"
        type='image'
        volume={options?.volume}
        value={options?.mediaId}
        onVolumeChange={(val) => {
          if (val !== null) {
            setOptions(o => ({
              ...(o ?? {}), volume: val,
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
        }}
        onChange={(val) => {
          if (val) {
            setOptions(o => ({
              ...(o ?? {}), mediaId: val,
            }));
          } else {
            setOptions(o => {
              const opts = o ?? {};
              delete opts.mediaId;
              if (Object.keys(opts).length === 0) {
                return null;
              }
              return { ...opts };
            });
          }
        }}
      />

      <FormSelectorGallery
        label="Audio"
        type='audio'
        volume={options?.volume}
        value={options?.audioId}
        onVolumeChange={(val) => {
          if (val !== null) {
            setOptions(o => ({
              ...(o ?? {}), volume: val,
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
        }}
        onChange={(val) => {
          if (val) {
            setOptions(o => ({
              ...(o ?? {}), audioId: val,
            }));
          } else {
            setOptions(o => {
              const opts = o ?? {};
              delete opts.audioId;
              if (Object.keys(opts).length === 0) {
                return null;
              }
              return { ...opts };
            });
          }
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
      position: 'relative', zIndex: 9999, cursor: 'pointer',
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