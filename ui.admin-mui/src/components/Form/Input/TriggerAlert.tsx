import { ExpandMoreTwoTone } from '@mui/icons-material';
import { Accordion, AccordionDetails, AccordionSummary, Box, Button, Checkbox, Collapse, Divider, Fade, FormControl, InputLabel, LinearProgress, ListSubheader, MenuItem, Select, Stack, Typography } from '@mui/material';
import { Alerts, EmitData, Overlay } from '@sogebot/backend/src/database/entity/overlay';
import { useSetAtom } from 'jotai';
import React from 'react';

import { AdditionalGridFormResponse } from './Response';
import { getSocket } from '../../../helpers/socket';
import { anItems, anMoveableId } from '../atoms';
import { AccordionAnimationIn } from '../Overlay/AlertSettings/Accordion/AnimationIn';
import { AccordionAnimationOut } from '../Overlay/AlertSettings/Accordion/AnimationOut';
import { AccordionAnimationText } from '../Overlay/AlertSettings/Accordion/AnimationText';
import { AccordionDuration } from '../Overlay/AlertSettings/Accordion/Duration';
import AlertSettingsAudio from '../Overlay/AlertSettings/Audio';
import AlertSettingsCustom from '../Overlay/AlertSettings/Custom';
import AlertSettingsGallery from '../Overlay/AlertSettings/Gallery';
import { anSelectedAlert, anSelectedVariantId } from '../Overlay/AlertSettings/src/atoms';
import AlertSettingsText from '../Overlay/AlertSettings/Text';
import AlertSettingsTTS from '../Overlay/AlertSettings/TTS';

type Props = {
  value:              any,
  idx:                number,
  onChange?:          (value: any) => void,
  disablePermission?: boolean,
  disableFilter?:     boolean,
  disableExecution?:  boolean,
};

const selectedItemRegex = /\$triggerAlert\((?<uuid>.{21}),? ?(?<options>.*)?\)/mi;

const jsonParseBase64String = (str: string) => {
  try {
    return JSON.parse(Buffer.from(str, 'base64').toString());
  } catch {
    return null;
  }
};

export const FormTriggerAlert: React.FC<Props> = ({ value, onChange,
  disablePermission,
  disableFilter,
  disableExecution }) => {
  const [ accordionId, setAccordionId ] = React.useState('');
  const [ overlays, setOverlays ] = React.useState<Overlay[]>([]);

  const setSelectedOverlay = useSetAtom(anItems);
  const setSelectedOverlayId = useSetAtom(anMoveableId);
  const setSelectedAlert = useSetAtom(anSelectedAlert);
  const setSelectedVariantId = useSetAtom(anSelectedVariantId);

  const [ loading, setLoading ] = React.useState(true);
  const [ propsValue, setPropsValue ] = React.useState(value);

  const parsedResponse = (value.response as string).match(selectedItemRegex);
  const parsedOptions = parsedResponse?.groups && parsedResponse?.groups.options
    ? jsonParseBase64String(parsedResponse?.groups.options)
    : null;

  const [ selectedItemId, setSelectedItemId ] = React.useState<null | string>(parsedResponse?.groups ? parsedResponse.groups.uuid : null);
  const [ options, setOptions ] = React.useState<null | EmitData['customOptions']>(parsedOptions);

  const currentVariant = React.useMemo(() => {
    if (!selectedItemId) {
      return null;
    }
    for (const overlay of overlays) {
      for (const overlayIt of overlay.items) {
        if (overlayIt.opts.typeId === 'alerts') {
          for (const alertIt of (overlayIt.opts as Alerts).items) {
            if (alertIt.id === selectedItemId || alertIt.variants.find(b => b.id === selectedItemId)) {
              // set overlayItem
              setSelectedOverlay(overlay);
              setSelectedOverlayId(overlayIt.id);

              if (alertIt.id === selectedItemId) {
                setSelectedAlert(alertIt);
                setSelectedVariantId(null);
                return alertIt;
              } else {
                for (const variant of alertIt.variants) {
                  if (variant.id === selectedItemId) {
                    setSelectedAlert(alertIt);
                    setSelectedVariantId(variant.id);
                    return variant;
                  }
                }
              }
            }
          }
        }
      }
    }

    return null;
  }, [selectedItemId, overlays ]);

  const [ expand, setExpand ] = React.useState(false);

  React.useEffect(() => {
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
      setLoading(false);
    });
  }, []);

  const resetOptions = () => {
    setOptions(null);
  };

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

  const getComponentOptions = React.useCallback(<T extends Alerts['items'][0]['items'][0]>(component: T) => {
    if (options && options.components && options.components[component.id]) {
      return options.components[component.id] as T;
    }
    return component;
  }, [ options]);

  return <>
    <FormControl fullWidth variant="filled" >
      <InputLabel id="type-select-label" shrink>Custom alert overlay</InputLabel>
      <Select
        label="Custom alert overlay"
        labelId="type-select-label"
        value={selectedItemId}
        displayEmpty
        onChange={(ev) => {
          setOptions(null);
          setSelectedItemId(ev.target.value);
        }}
      >
        <MenuItem value=''>Please select item</MenuItem>
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

    {currentVariant && <Collapse in={expand}>
      <Stack>
        <Divider sx={{ pt: 1 }}>
          <Typography variant='overline' component='span' sx={{
            display: 'inline-block', width: '200px',
          }}>
            Custom variant options
          </Typography>
        </Divider>

        <Stack direction='row' spacing={1}>
          <Box sx={{ width: '100%' }}>
            <AccordionDuration model={options?.alertDuration ?? currentVariant.alertDuration} open={accordionId}
              prependLabel={
                <Checkbox sx={{ margin: '-9px', marginRight: 'auto', alignSelf: 'flex-start' }} onClick={(ev) => {
                  ev.stopPropagation();
                }} checked={options?.alertDuration !== undefined} onChange={(_, checked) => {
                  if (checked) {
                    setOptions({
                      ...(options ?? {}), alertDuration: currentVariant.alertDuration,
                    });
                  } else {
                    setOptions({
                      ...(options ?? {}), alertDuration: undefined,
                    });
                  }
                }}/>
              }
              onOpenChange={setAccordionId} onChange={(val) => {
                setOptions({
                  ...(options ?? {}), alertDuration: val,
                });
              }}/>
            <AccordionAnimationText model={{
              animationText:        options?.animationText ?? currentVariant.animationText,
              animationTextOptions: options?.animationTextOptions ?? currentVariant.animationTextOptions,
            }} open={accordionId} onOpenChange={setAccordionId}
            prependLabel={
              <Checkbox sx={{ margin: '-9px', marginRight: 'auto', alignSelf: 'flex-start' }} onClick={(ev) => {
                ev.stopPropagation();
              }} checked={options?.animationText !== undefined || options?.animationTextOptions !== undefined} onChange={(_, checked) => {
                if (checked) {
                  setOptions({
                    ...(options ?? {}),
                    'animationText':        currentVariant.animationText,
                    'animationTextOptions': currentVariant.animationTextOptions,
                  });
                } else {
                  setOptions({
                    ...(options ?? {}), animationText: undefined, animationTextOptions: undefined,
                  });
                }
              }}/>
            }
            onChange={(val) => {
              setOptions({
                ...(options ?? {}),
                'animationText':        val.animationText,
                'animationTextOptions': val.animationTextOptions,
              });
            }}/>
          </Box>
          <Box sx={{ width: '100%' }}>
            <AccordionAnimationIn model={{
              animationIn:                 options?.animationIn ?? currentVariant.animationIn,
              animationInDuration:         options?.animationInDuration ?? currentVariant.animationInDuration,
              animationInWindowBoundaries: options?.animationInWindowBoundaries ?? currentVariant.animationInWindowBoundaries,
            }} open={accordionId} onOpenChange={setAccordionId}
            prependLabel={
              <Checkbox sx={{ margin: '-9px', marginRight: 'auto', alignSelf: 'flex-start' }} onClick={(ev) => {
                ev.stopPropagation();
              }} checked={options?.animationIn !== undefined || options?.animationInDuration !== undefined || options?.animationInWindowBoundaries !== undefined} onChange={(_, checked) => {
                if (checked) {
                  setOptions({
                    ...(options ?? {}),
                    'animationIn':        currentVariant.animationIn,
                    'animationInDuration': currentVariant.animationInDuration,
                    'animationInWindowBoundaries': currentVariant.animationInWindowBoundaries,
                  });
                } else {
                  setOptions({
                    ...(options ?? {}), animationIn: undefined, animationInDuration: undefined, animationInWindowBoundaries: undefined,
                  });
                }
              }}/>
            }
            onChange={(val) => {
              setOptions({
                ...(options ?? {}),
                'animationIn':                 val.animationIn,
                'animationInDuration':         val.animationInDuration,
                'animationInWindowBoundaries': val.animationInWindowBoundaries,
              });
            }}/>
            <AccordionAnimationOut model={{
              animationOut:                 options?.animationOut ?? currentVariant.animationOut,
              animationOutDuration:         options?.animationOutDuration ?? currentVariant.animationOutDuration,
              animationOutWindowBoundaries: options?.animationOutWindowBoundaries ?? currentVariant.animationOutWindowBoundaries,
            }} open={accordionId} onOpenChange={setAccordionId}
            prependLabel={
              <Checkbox sx={{ margin: '-9px', marginRight: 'auto', alignSelf: 'flex-start' }} onClick={(ev) => {
                ev.stopPropagation();
              }} checked={options?.animationOut !== undefined || options?.animationOutDuration !== undefined || options?.animationOutWindowBoundaries !== undefined} onChange={(_, checked) => {
                if (checked) {
                  setOptions({
                    ...(options ?? {}),
                    'animationOut':        currentVariant.animationOut,
                    'animationOutDuration': currentVariant.animationOutDuration,
                    'animationOutWindowBoundaries': currentVariant.animationOutWindowBoundaries,
                  });
                } else {
                  setOptions({
                    ...(options ?? {}), animationOut: undefined, animationOutDuration: undefined, animationOutWindowBoundaries: undefined,
                  });
                }
              }}/>
            }
            onChange={(val) => {
              setOptions({
                ...(options ?? {}),
                'animationOut':                 val.animationOut,
                'animationOutDuration':         val.animationOutDuration,
                'animationOutWindowBoundaries': val.animationOutWindowBoundaries,
              });
            }}/>
          </Box>
        </Stack>

        {currentVariant.items.length > 0 && <>
          <Divider sx={{ pt: 2 }}>
            <Typography variant='overline' component='span' sx={{
              display: 'inline-block', width: '200px',
            }}>
            Components options
            </Typography>
          </Divider>

          {currentVariant.items.map(component => <Accordion
            key={component.id}
            expanded={accordionId === component.id}>
            <AccordionSummary
              onClick={() => setAccordionId(accordionId === component.id ? '' : component.id)}>
              {component.type.toUpperCase()}
            </AccordionSummary>
            <AccordionDetails>
              {component.type === 'audio' && <AlertSettingsAudio model={getComponentOptions(component)} onChange={(changed) => {
                setOptions({
                  ...(options ?? {}),
                  components: {
                    ...(options?.components ?? {}),
                    [component.id]: changed,
                  },
                });
              }}/>}
              {component.type === 'tts' && <AlertSettingsTTS model={getComponentOptions(component)}  onChange={(changed) => {
                setOptions({
                  ...(options ?? {}),
                  components: {
                    ...(options?.components ?? {}),
                    [component.id]: changed,
                  },
                });
              }}/>}
              {component.type === 'text' && <AlertSettingsText model={getComponentOptions(component)}  onChange={(changed) => {
                setOptions({
                  ...(options ?? {}),
                  components: {
                    ...(options?.components ?? {}),
                    [component.id]: changed,
                  },
                });
              }}/>}
              {component.type === 'custom' && <AlertSettingsCustom model={getComponentOptions(component)}  onChange={(changed) => {
                setOptions({
                  ...(options ?? {}),
                  components: {
                    ...(options?.components ?? {}),
                    [component.id]: changed,
                  },
                });
              }}/>}
              {component.type === 'gallery' && <AlertSettingsGallery model={getComponentOptions(component)}  onChange={(changed) => {
                setOptions({
                  ...(options ?? {}),
                  components: {
                    ...(options?.components ?? {}),
                    [component.id]: changed,
                  },
                });
              }}/>}
            </AccordionDetails>
          </Accordion>)}

          <Box sx={{ pt: 2 }}>
            <Button disabled={options === null} variant='text' color='error' onClick={resetOptions}>Reset all options</Button>
          </Box>

        </>}
      </Stack>
    </Collapse>}
    {currentVariant && <Divider onClick={() => setExpand(!expand)} sx={{
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
    </Divider>}

    <AdditionalGridFormResponse disableExecution={disableExecution} disableFilter={disableFilter} disablePermission={disablePermission} value={propsValue} onChange={setPropsValue}/>
  </>;
};