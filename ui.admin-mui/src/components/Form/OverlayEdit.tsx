import {
  BorderInnerTwoTone, BorderStyleTwoTone,
  CropFreeTwoTone, FitScreenTwoTone, ZoomInTwoTone, ZoomOutTwoTone,
} from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Box, Button, DialogContent, Divider, Fade, Unstable_Grid2 as Grid, IconButton, LinearProgress, Paper, TextField, Tooltip,
} from '@mui/material';
import { Credits, Overlay } from '@sogebot/backend/dest/database/entity/overlay';
import { flatten } from '@sogebot/backend/dest/helpers/flatten';
import { setDefaultOpts } from '@sogebot/backend/dest/helpers/overlaysDefaultValues';
import { useAtom, useAtomValue } from 'jotai';
import { cloneDeep, set } from 'lodash';
import { nanoid } from 'nanoid';
import { useSnackbar } from 'notistack';
import React from 'react';
import Moveable from 'react-moveable';
import { useNavigate, useParams } from 'react-router-dom';
import { useKey, useLocalstorageState } from 'rooks';
import SimpleBar from 'simplebar-react';

import {
  anItems, anMoveableId, anSelectedItem, anSelectedItemCanvas, anSelectedItemOpts, emptyItem,
} from './atoms';
import { AlertsRegistryTesterAccordion } from './Overlay/AlertSettings/tester';
import { AlertsRegistrySettings } from './Overlay/AlertsRegistrySettings';
import { AlertsSettings } from './Overlay/AlertsSettings';
import { Canvas } from './Overlay/Canvas';
import { ChatSettings } from './Overlay/ChatSettings';
import { ClipsCarouselSettings } from './Overlay/ClipsCarouselSettings';
import { ClipsSettings } from './Overlay/ClipsSettings';
import { CountdownSettings } from './Overlay/CountdownSettings';
import { CreditsSettings } from './Overlay/CreditsSettings';
import { creditsDefaultScreens } from './Overlay/CreditsSettings/src/DefaultScreens';
import { EmotesComboSettings } from './Overlay/EmotesComboSettings';
import { EmotesExplodeSettings } from './Overlay/EmotesExplodeSettings';
import { EmotesFireworksSettings } from './Overlay/EmotesFireworksSettings';
import { EmotesSettings } from './Overlay/EmotesSettings';
import { EventlistSettings } from './Overlay/EventlistSettings';
import { GoalSettings } from './Overlay/GoalSettings';
import { HTMLSettings } from './Overlay/HTMLSettings';
import { ImageCarouselSettings } from './Overlay/ImageCarouselSettings';
import { Layers } from './Overlay/Layers';
import { MarathonSettings } from './Overlay/MarathonSettings';
import { OBSWebsocketSettings } from './Overlay/OBSWebsocketSettings';
import { PollsSettings } from './Overlay/PollsSettings';
import { RandomizerSettings } from './Overlay/RandomizerSettings';
import { RestAPI } from './Overlay/REST';
import { Settings } from './Overlay/Settings';
import { StatsSettings } from './Overlay/StatsSettings';
import { StopwatchSettings } from './Overlay/StopwatchSettings';
import { TTSSettings } from './Overlay/TTSSettings';
import { UrlSettings } from './Overlay/UrlSettings';
import { WordcloudSettings } from './Overlay/WordcloudSettings';
import { getSocket } from '../../helpers/socket';
import { useAppSelector } from '../../hooks/useAppDispatch';
import { useValidator } from '../../hooks/useValidator';
import { getParentDelKeyStatus } from '../../store/overlaySlice';
import theme from '../../theme';
import { loadFont } from '../Accordion/Font';
import { DimensionViewable, setZoomDimensionViewable } from '../Moveable/DimensionViewable';
import { RemoveButton, setZoomRemoveButton } from '../Moveable/RemoveButton';
import { AlertItem } from '../Overlay/AlertItem';
import { AlertItemNG } from '../Overlay/AlertItemNG';
import { ChatItem } from '../Overlay/ChatItem';
import { ClipsCarouselItem } from '../Overlay/ClipsCarouselItem';
import { ClipsItem } from '../Overlay/ClipsItem';
import { CountdownItem } from '../Overlay/CountdownItem';
import { EmotesComboItem } from '../Overlay/EmotesComboItem';
import { EmotesExplodeItem } from '../Overlay/EmotesExplodeItem';
import { EmotesFireworksItem } from '../Overlay/EmotesFireworksItem';
import { EmotesItem } from '../Overlay/EmotesItem';
import { EventlistItem } from '../Overlay/EventlistItem';
import { ExportDialog } from '../Overlay/ExportDialog';
import { GoalItem } from '../Overlay/GoalItem';
import { HTMLItem } from '../Overlay/HTMLItem';
import { HypeTrainItem } from '../Overlay/HypeTrainItem';
import { ImageCarouselItem } from '../Overlay/ImageCarouselItem';
import { ImportDialog } from '../Overlay/ImportDialog';
import { MarathonItem } from '../Overlay/MarathonItem';
import { OBSWebsocketItem } from '../Overlay/OBSWebsocketItem';
import { PollsItem } from '../Overlay/PollsItem';
import { RandomizerItem } from '../Overlay/RandomizerItem';
import { StatsItem } from '../Overlay/StatsItem';
import { StopwatchItem } from '../Overlay/StopwatchItem';
import { TTSItem } from '../Overlay/TTSItem';
import { UrlItem } from '../Overlay/UrlItem';
import { WordcloudItem } from '../Overlay/WordcloudItem';

const generateLinkId = (server: string, id: string) => {
  return Buffer.from(JSON.stringify({
    server, id,
  })).toString('base64');
};

let disabledMouseMove = false;

export const OverlayEdit: React.FC = () => {
  const navigate = useNavigate();
  const [ server ] = useLocalstorageState('server', 'https://demobot.sogebot.xyz');
  const { id } = useParams();
  const [ moveableId, setMoveableId ] = useAtom(anMoveableId);
  const moveableRef = React.useMemo(() => document.getElementById(moveableId!), [ moveableId ]);
  const [elementGuidelines, setElementGuidelines] = React.useState<Element[]>([]);
  const [ key, setKey ] = React.useState(Date.now());

  const containerRef = React.useRef<HTMLDivElement>();

  const [ zoom, setZoom ] = React.useState(1);
  const [frame, setFrame] = React.useState({
    translate: [0,0], rotate: 0,
  });

  const [ position, setPosition ] = React.useState([50, 0]);
  const [ isPositionChanging, setPositionChanging ] = React.useState(false);

  const [bounds, setBounds] = React.useState<undefined | { top: number, left: number, right: number, bottom: number }>({
    top: 0, left: 0, right: 0, bottom: 0,
  });
  const [boundsEnabled, setBoundsEnabled] = React.useState(false);
  const [snapEnabled, setSnapEnabled] = React.useState(true);

  const [ item, setItem ] = useAtom(anItems);

  const selectedItem = useAtomValue(anSelectedItem);
  const selectedItemCanvas = useAtomValue(anSelectedItemCanvas);
  const selectedItemOpts = useAtomValue(anSelectedItemOpts);

  const isDeleteKeyDisabled = useAppSelector(getParentDelKeyStatus);
  useKey(['Delete'], () => {
    if (isDeleteKeyDisabled) {
      console.log('Parent del key disabled');
      return;
    }

    const focusedElement = document.activeElement;
    if (focusedElement?.tagName === 'INPUT'
    || focusedElement?.tagName === 'TEXTAREA'
    || focusedElement?.tagName === 'SELECT') {
      console.log('Del key disabled, because we are focusing input');
      return;
    }

    if (selectedItem) {
      setItem(o => ({
        ...o,
        items: o.items.filter(i => {
          return i.id.replace(/-/g, '') !== selectedItem.id && i.id !== selectedItem.id;
        }),
      }) as any);
      setMoveableId(null);
    }
  }, { when: !!selectedItem });

  const refresh = React.useCallback(() => setKey(Date.now()), [ setKey ]);

  const handleItemChange = React.useCallback((changes: { [path: string]: any }) => {
    setItem((val) => {
      const updatedItems = cloneDeep(val.items);
      const updatedItem = updatedItems.find(o => o.id.replace(/-/g, '') === moveableId);
      if (updatedItem) {
        for (const [path, value] of Object.entries(changes)) {
          set(updatedItem, path, value);
        }
      } else {
        console.error('Updated item not found');
      }
      return {
        ...val,
        items: updatedItems,
      } as Overlay;
    });
  }, [moveableId]);
  React.useEffect(() => {
    // items to have snaps
    const els: any[] = [];
    for (const i of item.items) {
      els.push(document.getElementById(i.id.replace(/-/g, '')));
    }
    setElementGuidelines(els);

    // set bounds
    if (boundsEnabled) {
      setBounds({
        left:   0,
        top:    0,
        right:  item.canvas.width,
        bottom: item.canvas.height,
      });
    } else {
      setBounds(undefined);
    }
  }, [moveableId, item, boundsEnabled]);

  const [ loading, setLoading ] = React.useState(true);
  const [ saving, setSaving ] = React.useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const { reset, haveErrors, validate } = useValidator();

  React.useEffect(() => {
    if (id) {
      setLoading(true);
      getSocket('/registries/overlays').emit('generic::getOne', id, (err, data) => {
        if (err) {
          return console.error(err);
        }
        if (!data) {
          enqueueSnackbar('Overlay with id ' + id + ' not found.');
          navigate(`/registry/overlays?server=${JSON.parse(localStorage.server)}`);
        } else {
          const withDefaultValues = {
            ...data,
            items: data.items.map(it => ({
              ...it, opts: setDefaultOpts(it.opts, it.opts.typeId),
            })),
          };
          setItem(withDefaultValues);
          setLoading(false);
        }
      });
    } else {
      setItem(Object.assign(new Overlay(), emptyItem));
      setLoading(false);
    }
    reset();
  }, [id, reset, enqueueSnackbar, navigate]);

  React.useEffect(() => {
    if (!loading && item) {
      // load fonts
      for (const items of item.items) {
        const flattenItem = flatten(items);
        Object.keys(flattenItem).filter(o => o.toLowerCase().includes('font') && o.toLowerCase().includes('family')).forEach((k) => {
          loadFont(flattenItem[k]);
        });
      }
    }
  }, [item, loading]);

  React.useEffect(() => {
    if (!loading && item) {
      validate(Overlay, item);
    }
  }, [item, loading, validate]);

  const handleClose = () => {
    navigate(`/registry/overlays?server=${JSON.parse(localStorage.server)}`);
  };

  const copy = React.useCallback((link: string) => {
    navigator.clipboard.writeText(`${link}`);
    enqueueSnackbar(<div>Overlay link copied to clipboard.</div>);
  }, [ enqueueSnackbar, server ]);

  const handleLinkCopy = () => {
    copy(`${window.location.origin}/overlays/${generateLinkId(server, id!)}`);
  };

  const handleSave = React.useCallback(() => {
    setSaving(true);
    getSocket('/registries/overlays').emit('generic::save', item, (err, data) => {
      setSaving(false);
      if (err || !data) {
        enqueueSnackbar('Something went wrong during save. Check Chrome logs for more errors.', { variant: 'error' });
        return console.error(err);
      }
      enqueueSnackbar('Saved successfully.', { variant: 'success' });
      if (id !== data.id) {
        navigate(`/registry/overlays/edit/${data.id}?server=${JSON.parse(localStorage.server)}`);
      }
    });
  }, [id, item, navigate]);

  const fitZoomOnScreen = React.useCallback((isZoomReset = false) => {
    if (containerRef.current) {
      if (!isZoomReset) {
        // we need to reset zoom first
        setZoom(1);
        setPosition([50, 0]);
        setTimeout(() => fitZoomOnScreen(true));
        return;
      }
      const zoomHeight = ((containerRef.current.getBoundingClientRect().height - 40) / containerRef.current.scrollHeight);
      const zoomWidth = ((containerRef.current.getBoundingClientRect().width - 40) / containerRef.current.scrollWidth);
      setZoom(Math.min(zoomHeight, zoomWidth));
    }
  }, [containerRef.current]);

  React.useEffect(() => {
    setZoomDimensionViewable(zoom);
    setZoomRemoveButton(zoom);
  }, [ zoom ]);

  return(<>
    {loading && <>
      <LinearProgress />
      <DialogContent sx={{
        p: 0, overflowX: 'hidden',
      }}/>
    </>}
    <Fade in={!loading} mountOnEnter unmountOnExit>
      { item && <DialogContent sx={{
        p: 0, overflowX: 'hidden',
      }}>
        <Grid container spacing={0} sx={{
          height: '100%', m: 0,
        }}>
          <Grid sx={{
            backgroundColor: '#1e1e1e', p: 1, width: '352px',
          }}>
            <Box sx={{ p: 1 }}>
              <Tooltip title="Snap">
                <IconButton onClick={() => setSnapEnabled(o => !o)} sx={{ backgroundColor: snapEnabled ? `${theme.palette.primary.main}55` : undefined }}><BorderInnerTwoTone/></IconButton>
              </Tooltip>
              <Tooltip title="Bounds">
                <IconButton  onClick={() => setBoundsEnabled(o => !o)} sx={{ backgroundColor: boundsEnabled ? `${theme.palette.primary.main}55` : undefined }}><BorderStyleTwoTone/></IconButton>
              </Tooltip>
              <Tooltip title="Zoom in">
                <IconButton onClick={() => setZoom(o => o + 0.05)}><ZoomInTwoTone/></IconButton>
              </Tooltip>
              <Tooltip title="Zoom out">
                <IconButton onClick={() => setZoom(o => o - 0.05)}><ZoomOutTwoTone/></IconButton>
              </Tooltip>
              <Tooltip title="Fit screen">
                <IconButton onClick={() => fitZoomOnScreen()}><FitScreenTwoTone/></IconButton>
              </Tooltip>
              <Tooltip title='Reset zoom'>
                <IconButton onClick={() => {
                  setZoom(1);
                  setPosition([50, 0]);
                }}><CropFreeTwoTone/></IconButton>
              </Tooltip>
              <ExportDialog model={item}/>
              <ImportDialog onImport={(items) => setItem(it => ({
                ...it,
                items: [
                  ...it.items, ...items,
                ],
              }) as Overlay)}/>
            </Box>

            <SimpleBar style={{ maxHeight: 'calc(100vh - 189px)' }} autoHide={false}>
              <TextField
                sx={{ mb: 0.5 }}
                label={'Name'}
                fullWidth
                value={item.name}
                onChange={(ev) => {
                  setItem({
                    ...item, name: ev.currentTarget.value,
                  } as Overlay);
                }}
              />
              <Canvas model={item.canvas} onUpdate={canvas => setItem(i => ({
                ...i, canvas,
              } as Overlay ))}/>
              <Layers
                items={item.items}
                moveableId={moveableId}
                setMoveableId={setMoveableId} onUpdate={(value) => setItem(o => ({
                  ...o, items: value,
                } as Overlay))}
                onAdd={(typeId) => {
                  setItem(o => {
                    const itemId = nanoid();
                    const opts = setDefaultOpts({}, typeId);
                    if (typeId === 'credits') {
                      (opts as Credits).screens = creditsDefaultScreens;
                    }
                    const newItem = {
                      id:        itemId,
                      alignX:    0,
                      alignY:    0,
                      isVisible: true,
                      name:      '',
                      rotation:  0,
                      height:    typeId === 'credits' || typeId === 'alerts' ? item.canvas.height : 200,
                      width:     typeId === 'credits' || typeId === 'alerts' ? item.canvas.width : 200,
                      opts,
                    } as Overlay['items'][number];

                    setTimeout(() => {
                      setMoveableId(itemId);
                    }, 10);

                    return {
                      ...o, items: [...o.items, newItem],
                    } as Overlay;
                  });
                }}
              />
            </SimpleBar>
          </Grid>
          <Grid xs sx={{ height: '100%' }}
            onContextMenu={(e) => {
              setMoveableId(null);
              e.stopPropagation();
              e.preventDefault();
            }}>
            <Box id="container" className="positionHandler"
              onMouseMove={(e) => {
                if (disabledMouseMove) {
                  return;
                }
                if (e.buttons === 1) {
                  const target = e.target as HTMLElement;
                  if (target.classList.contains('positionHandler')) {
                    e.preventDefault();
                    e.stopPropagation();
                    setPosition(o => [o[0] + (e.movementX / zoom), o[1] + (e.movementY / zoom)]);
                    setPositionChanging(true);
                  }
                } else {
                  if (isPositionChanging){
                    setPositionChanging(false);
                  }
                }
              }}
              onWheel={(e) => {
                setZoom(o => o + (e.deltaY < 0 ? 0.025 : -0.025));
              }}
              sx={{
                backgroundColor: '#343434',
                width:           '100%',
                height:          '100%',
                position:        'relative',
                overflow:        'hidden',
                cursor:          'grab',
                p:               5,
              }}  ref={containerRef}>
              <Paper
                className="positionHandler"
                sx={{
                  height:          `${item.canvas.height}px`,
                  width:           `${item.canvas.width}px`,
                  position:        'absolute',
                  border:          `${1/zoom}px solid grey !important`,
                  transformOrigin: '0 0',
                  transform:       `scale(${zoom}) translate(${position[0]}px, ${position[1]}px)`,
                  backgroundImage: `linear-gradient(45deg, #222 25%, transparent 25%),
                                      linear-gradient(135deg, #222 25%, transparent 25%),
                                      linear-gradient(45deg, transparent 75%, #222 75%),
                                      linear-gradient(135deg, transparent 75%, #222 75%)`,
                  backgroundSize:     `20px 20px`, /* Must be a square */
                  backgroundPosition: `0 0, 10px 0, 10px -10px, 0px 10px`, /* Must be half of one side of the square */
                }}>
                {item.items.map(o => <Paper
                  id={o.id.replace(/-/g, '')}
                  key={`${o.id}`}
                  onMouseDown={(e) => {
                    if (e.button !== 1) {
                      e.stopPropagation();
                      e.preventDefault();
                    }
                  }}
                  onClick={(e) => {
                    setMoveableId(o.id.replace(/-/g, ''));
                    e.stopPropagation();
                    e.preventDefault();
                  }}
                  elevation={0}
                  sx={{
                    position:        'absolute',
                    width:           `${o.width}px`,
                    height:          `${o.height}px`,
                    backgroundColor: `transparent`,
                    border:          `0 !important`,
                    left:            `${o.alignX}px`,
                    top:             `${o.alignY}px`,
                    fontWeight:      '900',
                    fontSize:        `${20}px`,
                    textTransform:   'uppercase',
                    userSelect:      'none',
                    cursor:          moveableId === o.id.replace(/-/g, '') ? 'move' : 'pointer',
                    lineHeight:      `${12}px`,
                    '& small':       { fontSize: `${12}px` },
                    transform:       `rotate(${ o.rotation ?? 0 }deg)`,
                  }}
                >
                  <Box key={`${o.id}-${JSON.stringify(o.opts)}` /* force refresh on opts change */} sx={{
                    width: '100%', height: '100%',
                  }}>
                    {o.opts.typeId === 'alertsRegistry' && <AlertItem width={o.width} height={o.height} item={o.opts} groupId={id!} id={o.id} selected={selectedItem?.id === o.id}/>}
                    {o.opts.typeId === 'alerts' && <AlertItemNG width={o.width} height={o.height} item={o.opts} groupId={id!} id={o.id} selected={selectedItem?.id === o.id}/>}
                    {o.opts.typeId === 'countdown' && <CountdownItem width={o.width} height={o.height} item={o.opts} groupId={id!} id={o.id} selected={selectedItem?.id === o.id}/>}
                    {o.opts.typeId === 'stopwatch' && <StopwatchItem width={o.width} height={o.height} item={o.opts} groupId={id!} id={o.id} selected={selectedItem?.id === o.id}/>}
                    {o.opts.typeId === 'marathon' && <MarathonItem width={o.width} height={o.height} item={o.opts} groupId={id!} id={o.id} selected={selectedItem?.id === o.id}/>}
                    {o.opts.typeId === 'obswebsocket' && <OBSWebsocketItem width={o.width} height={o.height} item={o.opts} groupId={id!} id={o.id} selected={selectedItem?.id === o.id}/>}
                    {o.opts.typeId === 'chat' && <ChatItem width={o.width} height={o.height} item={o.opts} groupId={id!} id={o.id} selected={selectedItem?.id === o.id}/>}
                    {o.opts.typeId === 'stats' && <StatsItem width={o.width} height={o.height} item={o.opts} groupId={id!} id={o.id} selected={selectedItem?.id === o.id}/>}
                    {o.opts.typeId === 'tts' && <TTSItem width={o.width} height={o.height} item={o.opts} groupId={id!} id={o.id} selected={selectedItem?.id === o.id}/>}
                    {o.opts.typeId === 'polls' && <PollsItem width={o.width} height={o.height} item={o.opts} groupId={id!} id={o.id} selected={selectedItem?.id === o.id}/>}
                    {o.opts.typeId === 'emotesfireworks' && <EmotesFireworksItem width={o.width} height={o.height} item={o.opts} groupId={id!} id={o.id} selected={selectedItem?.id === o.id}/>}
                    {o.opts.typeId === 'emotescombo' && <EmotesComboItem width={o.width} height={o.height} item={o.opts} groupId={id!} id={o.id} selected={selectedItem?.id === o.id}/>}
                    {o.opts.typeId === 'emotesexplode' && <EmotesExplodeItem width={o.width} height={o.height} item={o.opts} groupId={id!} id={o.id} selected={selectedItem?.id === o.id}/>}
                    {o.opts.typeId === 'emotes' && <EmotesItem width={o.width} height={o.height} item={o.opts} groupId={id!} id={o.id} selected={selectedItem?.id === o.id}/>}
                    {o.opts.typeId === 'clipscarousel' && <ClipsCarouselItem width={o.width} height={o.height} item={o.opts} groupId={id!} id={o.id}/>}
                    {o.opts.typeId === 'clips' && <ClipsItem width={o.width} height={o.height} item={o.opts} groupId={id!} id={o.id}/>}
                    {o.opts.typeId === 'carousel' && <ImageCarouselItem width={o.width} height={o.height} item={o.opts} groupId={id!} id={o.id}/>}
                    {o.opts.typeId === 'eventlist' && <EventlistItem width={o.width} height={o.height} item={o.opts} groupId={id!} id={o.id}/>}
                    {o.opts.typeId === 'goal' && <GoalItem width={o.width} height={o.height} item={o.opts} groupId={id!} id={o.id}/>}
                    {o.opts.typeId === 'html' && <HTMLItem width={o.width} height={o.height} item={o.opts} groupId={id!} id={o.id}/>}
                    {o.opts.typeId === 'hypetrain' && <HypeTrainItem width={o.width} height={o.height} item={o.opts} groupId={id!} id={o.id} selected={selectedItem?.id === o.id}/>}
                    {o.opts.typeId === 'url' && <UrlItem width={o.width} height={o.height} item={o.opts} groupId={id!} id={o.id}/>}
                    {o.opts.typeId === 'randomizer' && <RandomizerItem width={o.width} height={o.height} item={o.opts} groupId={id!} id={o.id} selected={selectedItem?.id === o.id}/>}
                    {o.opts.typeId === 'wordcloud' && <WordcloudItem width={o.width} height={o.height} item={o.opts} groupId={id!} id={o.id}/>}
                  </Box>
                </Paper>)}
                {moveableId && <Moveable
                  key={`${moveableId}-${key}-${snapEnabled}`}
                  aria-type={selectedItem?.opts.typeId}
                  ables={[DimensionViewable, RemoveButton]}
                  props={{
                    dimensionViewable: true, removeButton: true,
                  }}
                  target={moveableRef}
                  resizable={true}
                  origin={false}
                  bounds={bounds}
                  onDelete={() => {
                    setItem(o => ({
                      ...o,
                      items: o.items.filter(i => i.id.replace(/-/g, '') !== moveableId),
                    }) as any);
                    setMoveableId(null);
                  }}
                  horizontalGuidelines={[item.canvas.height / 4, item.canvas.height / 2, (item.canvas.height / 4) * 3]}
                  verticalGuidelines={[item.canvas.width / 4, item.canvas.width / 2, (item.canvas.width / 4) * 3]}
                  isDisplayInnerSnapDigit={true}
                  elementGuidelines={elementGuidelines}
                  snappable={true}
                  snapThreshold={5}
                  isDisplaySnapDigit={true}
                  snapGap={true}
                  snapDirections={{
                    top:    snapEnabled,
                    right:  snapEnabled,
                    bottom: snapEnabled,
                    left:   snapEnabled,
                    center: snapEnabled,
                    middle: snapEnabled,

                  }}
                  elementSnapDirections={{
                    top:    snapEnabled,
                    right:  snapEnabled,
                    bottom: snapEnabled,
                    left:   snapEnabled,
                    center: snapEnabled,
                    middle: snapEnabled,

                  }}
                  snapDigit={0}
                  draggable={true}
                  checkInput
                  throttleDrag={0}
                  startDragRotate={0}
                  throttleDragRotate={0}
                  padding={{
                    'left': 0,'top': 0,'right': 0,'bottom': 0,
                  }}
                  rotationPosition={'top'}
                  rotatable={true}
                  throttleRotate={0}
                  onRotateStart={e => {
                    disabledMouseMove = true;
                    e.set(frame.rotate);
                  }}
                  onRotate={e => {
                    frame.rotate =  e.beforeRotate;
                    e.target.style.transform = `rotate(${ e.beforeRotate}deg)`;
                  }}
                  onRotateEnd={e => {
                    disabledMouseMove = false;
                    if (selectedItem) {
                      handleItemChange({ 'rotation': frame.rotate });
                      // reset things
                      e.target.style.removeProperty('transform');
                      refresh();
                    }
                  }}
                  onResizeEnd={e => {
                    disabledMouseMove = false;
                    if (selectedItem) {
                      handleItemChange({
                        'width':  Math.round((e.target as any).offsetWidth),
                        'height': Math.round((e.target as any).offsetHeight),
                        'alignX': Math.round(selectedItem.alignX + frame.translate[0]),
                        'alignY': Math.round(selectedItem.alignY + frame.translate[1]),
                      });
                      // reset things
                      e.target.style.removeProperty('width');
                      e.target.style.removeProperty('height');
                      e.target.style.removeProperty('transform');
                      refresh();
                    }
                  }}
                  onResizeStart={e => {
                    disabledMouseMove = true;
                    e.setOrigin(['%', '%']);
                    e.dragStart && e.dragStart.set(frame.translate);
                  }}
                  onResize={e => {
                    const beforeTranslate = e.drag.beforeTranslate;

                    frame.translate = beforeTranslate;
                    e.target.style.width = `${e.width}px`;
                    e.target.style.height = `${e.height}px`;
                    e.target.style.transform = `translate(${beforeTranslate[0]}px, ${beforeTranslate[1]}px) rotate(${selectedItem?.rotation ?? 0}deg)`;
                  }}
                  onDragEnd={(e) => {
                    disabledMouseMove = false;
                    if (selectedItem) {
                      handleItemChange({
                        'alignX': Math.round(selectedItem.alignX + frame.translate[0]),
                        'alignY': Math.round(selectedItem.alignY + frame.translate[1]),
                      });
                      e.target.style.transform = `translate(0px, 0px) rotate(${selectedItem?.rotation ?? 0}deg)`;
                      refresh();
                    }
                  }}
                  onDragStart={(e) => {
                    disabledMouseMove = true;
                    if (e.clientY < e.target.getBoundingClientRect().top) {
                      // disable drag if clicking outside of the box
                      // checking currently only top side of moveable
                      e.stopDrag();
                      return;
                    }
                    setFrame(val => ({
                      translate: [0, 0], rotate: val.rotate,
                    }));
                  }}
                  onDrag={e => {
                    setFrame(val => ({
                      translate: e.beforeTranslate, rotate: val.rotate,
                    }));
                    e.target.style.transform = `translate(${e.beforeTranslate[0]}px, ${e.beforeTranslate[1]}px) rotate(${selectedItem?.rotation ?? 0}deg)`;
                  }}
                />}
              </Paper>
            </Box>
          </Grid>
          {selectedItem && <Grid sx={{
            backgroundColor: '#1e1e1e', p: 1, pr: 0.5, width: '352px',
          }}>
            <SimpleBar style={{
              maxHeight: 'calc(100vh - 70px)', paddingRight: '15px',
            }} autoHide={false}>
              <Settings model={selectedItem} onUpdate={(path, value) => {
                handleItemChange({ [path]: value });
                setTimeout(() => refresh(), 100);
              }}>
                <Divider variant='middle'/>
                {selectedItemOpts && <>
                  {selectedItemOpts.typeId === 'alerts' && <AlertsSettings onUpdate={(val) => {
                    handleItemChange({ 'opts': val });
                  }}/>}
                  {selectedItemOpts.typeId === 'randomizer' && <RandomizerSettings model={selectedItemOpts} onUpdate={(val) => {
                    handleItemChange({ 'opts': val });
                  }}/>}
                  {selectedItemOpts.typeId === 'stats' && <StatsSettings model={selectedItemOpts} onUpdate={(val) => {
                    handleItemChange({ 'opts': val });
                  }}/>}
                  {selectedItemOpts.typeId === 'credits' && <CreditsSettings canvas={selectedItemCanvas} model={selectedItemOpts} onUpdate={(val) => {
                    handleItemChange({ 'opts': val });
                  }}/>}
                  {selectedItemOpts.typeId === 'goal' && <GoalSettings model={selectedItemOpts} onUpdate={(val) => {
                    handleItemChange({ 'opts': val });
                  }}/>}
                  {selectedItemOpts.typeId === 'clips' && <ClipsSettings model={selectedItemOpts} onUpdate={(val) => {
                    handleItemChange({ 'opts': val });
                  }}/>}
                  {selectedItemOpts.typeId === 'clipscarousel' && <ClipsCarouselSettings model={selectedItemOpts} onUpdate={(val) => {
                    handleItemChange({ 'opts': val });
                  }}/>}
                  {selectedItemOpts.typeId === 'carousel' && <ImageCarouselSettings model={selectedItemOpts} onUpdate={(val) => {
                    handleItemChange({ 'opts': val });
                  }}/>}
                  {selectedItemOpts.typeId === 'eventlist' && <EventlistSettings model={selectedItemOpts} onUpdate={(val) => {
                    handleItemChange({ 'opts': val });
                  }}/>}
                  {selectedItemOpts.typeId === 'countdown' && <CountdownSettings id={selectedItem.id} model={selectedItemOpts} onUpdate={(val) => {
                    handleItemChange({ 'opts': val });
                  }}/>}
                  {selectedItemOpts.typeId === 'stopwatch' && <StopwatchSettings model={selectedItemOpts} onUpdate={(val) => {
                    handleItemChange({ 'opts': val });
                  }}/>}
                  {selectedItemOpts.typeId === 'emotescombo' && <EmotesComboSettings model={selectedItemOpts} onUpdate={(val) => {
                    handleItemChange({ 'opts': val });
                  }}/>}
                  {selectedItemOpts.typeId === 'emotesexplode' && <EmotesExplodeSettings model={selectedItemOpts} onUpdate={(val) => {
                    handleItemChange({ 'opts': val });
                  }}/>}
                  {selectedItemOpts.typeId === 'emotesfireworks' && <EmotesFireworksSettings model={selectedItemOpts} onUpdate={(val) => {
                    handleItemChange({ 'opts': val });
                  }}/>}
                  {selectedItemOpts.typeId === 'emotes' && <EmotesSettings model={selectedItemOpts} onUpdate={(val) => {
                    handleItemChange({ 'opts': val });
                  }}/>}
                  {selectedItemOpts.typeId === 'html' && <HTMLSettings model={selectedItemOpts} onUpdate={(val) => {
                    handleItemChange({ 'opts': val });
                  }}/>}
                  {selectedItemOpts.typeId === 'marathon' && <MarathonSettings model={selectedItemOpts} onUpdate={(val) => {
                    handleItemChange({ 'opts': val });
                  }}/>}
                  {selectedItemOpts.typeId === 'obswebsocket' && <OBSWebsocketSettings model={selectedItemOpts} onUpdate={(val) => {
                    handleItemChange({ 'opts': val });
                  }}/>}
                  {selectedItemOpts.typeId === 'polls' && <PollsSettings model={selectedItemOpts} onUpdate={(val) => {
                    handleItemChange({ 'opts': val });
                  }}/>}
                  {selectedItemOpts.typeId === 'tts' && <TTSSettings model={selectedItemOpts} onUpdate={(val) => {
                    handleItemChange({ 'opts': val });
                  }}/>}
                  {selectedItemOpts.typeId === 'chat' && <ChatSettings model={selectedItemOpts} onUpdate={(val) => {
                    handleItemChange({ 'opts': val });
                  }}/>}
                  {selectedItemOpts.typeId === 'alertsRegistry' && <AlertsRegistrySettings model={selectedItemOpts} onUpdate={(val) => {
                    handleItemChange({ 'opts': val });
                  }}/>}
                  {selectedItemOpts.typeId === 'url' && <UrlSettings model={selectedItemOpts} onUpdate={(val) => {
                    handleItemChange({ 'opts': val });
                  }}/>}
                  {selectedItemOpts.typeId === 'wordcloud' && <WordcloudSettings model={selectedItemOpts} onUpdate={(val) => {
                    handleItemChange({ 'opts': val });
                  }}/>}
                </>}
              </Settings>

              {selectedItem?.opts.typeId === 'alertsRegistry' && <AlertsRegistryTesterAccordion/>}

              {
                selectedItem
                  && ['countdown', 'stopwatch'].includes(selectedItemOpts!.typeId)
                  && <RestAPI id={selectedItem.id} opts={selectedItemOpts!}/>
              }
            </SimpleBar>
          </Grid>}
        </Grid>
      </DialogContent>}
    </Fade>
    <Divider/>
    <Box sx={{ p: 1 }}>
      <Grid container sx={{ height: '100%' }} justifyContent={'end'} spacing={1}>
        <Grid sx={{ mr: 'auto' }}>
          <Button sx={{ width: 150 }} onClick={handleLinkCopy}>overlay link</Button>
        </Grid>
        <Grid>
          <Button sx={{ width: 150 }} onClick={handleClose}>Close</Button>
        </Grid>
        <Grid>
          <LoadingButton variant='contained' color='primary' sx={{ width: 150 }} onClick={handleSave} loading={saving} disabled={haveErrors || loading}>Save</LoadingButton>
        </Grid>
      </Grid>
    </Box>
  </>);
};