import {

  CropFreeTwoTone, FitScreenTwoTone, ZoomInTwoTone, ZoomOutTwoTone,
} from '@mui/icons-material';
import {
  Box, DialogContent, Divider, FormControl, FormLabel, Unstable_Grid2 as Grid, IconButton, InputAdornment, InputLabel, MenuItem, Paper, Select, Slider, Stack, TextField, Tooltip,
} from '@mui/material';
import { CreditsScreenClips, Overlay } from '@sogebot/backend/dest/database/entity/overlay';
import React from 'react';
import { useMouse, usePreviousImmediate } from 'rooks';
import SimpleBar from 'simplebar-react';

import { useTranslation } from '../../../../hooks/useTranslation';
import { useValidator } from '../../../../hooks/useValidator';
import { AccordionFont, loadFont } from '../../../Accordion/Font';
import { setZoomDimensionViewable } from '../../../Moveable/DimensionViewable';
import { setZoomRemoveButton } from '../../../Moveable/RemoveButton';
import { CreditsClips } from '../../../Overlay/CreditsClips';
import { FormNumericInput } from '../../Input/Numeric';

let isPositionChanging = false;
document.addEventListener('mouseup', () => isPositionChanging = false);

type Props = {
  model: CreditsScreenClips;
  canvas: { width: number, height: number },
  onUpdate: (value: CreditsScreenClips) => void;
};

export const CreditsSettingsClips: React.FC<Props> = ({ model, canvas, onUpdate }) => {
  const { translate } = useTranslation();
  const [ accordion, setAccordion ] = React.useState('');
  const { x, y } = useMouse();
  const mouseX = usePreviousImmediate(x);
  const mouseY = usePreviousImmediate(y);

  const containerRef = React.useRef<HTMLDivElement>();

  const [ zoom, setZoom ] = React.useState(1);

  const [ position, setPosition ] = React.useState([50, 0]);

  React.useEffect(() => {
    if (isPositionChanging && x && y && mouseX && mouseY) {
      setPosition(pos => {
        return [pos[0] + ((x - mouseX) / zoom), pos[1] + ((y - mouseY) / zoom)];
      });
    }
  }, [x, y, mouseY, mouseX, zoom]);

  const [ item, setItem ] = React.useState<CreditsScreenClips>(model);
  React.useEffect(() => {
    onUpdate(item);
  }, [ item ]);

  const { validate } = useValidator();

  React.useEffect(() => {
    loadFont(item.gameFont.family);
    loadFont(item.titleFont.family);
    loadFont(item.createdByFont.family);
  }, [item.gameFont.family, item.createdByFont.family, item.titleFont.family]);

  React.useEffect(() => {
    validate(Overlay, item);
  }, [item, validate]);

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
    <DialogContent sx={{
      p: 0, overflowX: 'hidden',
    }}>
      <Grid container spacing={0} sx={{
        height: '100%', m: 0,
      }}>
        <Grid sx={{
          backgroundColor: '#1e1e1e', p: 1, width: '352px',
        }}>
          <Box sx={{ p: 1 }}>
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
          </Box>

          <SimpleBar style={{ maxHeight: 'calc(100vh - 125px)' }} autoHide={false}>
            <Stack spacing={0.5}>
              <TextField
                sx={{ mb: 0.5 }}
                label={'Name'}
                fullWidth
                value={item.name}
                onChange={(ev) => {
                  setItem({
                    ...item, name: ev.currentTarget.value,
                  });
                }}
              />

              <TextField
                value={'Set automatically by canvas height'}
                label='Height'
                InputProps={{ readOnly: true }}
              />

              <FormControl fullWidth>
                <InputLabel id="type-select-label" shrink>Rolling Speed</InputLabel>
                <Select
                  MenuProps={{ PaperProps: { sx: { maxHeight: 200 } } }}
                  label='Speed'
                  displayEmpty
                  value={item.speed ?? ''}
                  onChange={(ev) => setItem({
                    ...item, speed: ev.target.value === '' ? null : (ev.target.value as typeof item.speed),
                  })}
                >
                  <MenuItem value={''}>--- use global value ---</MenuItem>
                  {['very slow', 'slow', 'medium', 'fast', 'very fast'].map(
                    it => <MenuItem value={it} key={it}>{it}</MenuItem>,
                  )}
                </Select>
              </FormControl>

              <FormNumericInput
                min={0}
                value={item.waitBetweenScreens}
                displayEmpty
                placeholder='Use global value'
                label='Wait between screens'
                helperText='Pauses rolling on screen end.'
                InputProps={{ endAdornment: <InputAdornment position='end'>ms</InputAdornment> }}
                onChange={val => {
                  setItem({
                    ...item,
                    waitBetweenScreens: val as number,
                  });
                }}
              />
            </Stack>
          </SimpleBar>
        </Grid>
        <Grid xs sx={{ height: '100%' }}
          onContextMenu={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}>
          <Box id="container"
            onMouseDown={() => isPositionChanging = true}
            onWheel={(e) => {
              setZoom(o => o + (e.deltaY < 0 ? 0.025 : -0.025));
            }}
            sx={{
              backgroundColor: '#343434',
              width:           '100%',
              height:          '100%',
              position:        'relative',
              overflow:        'hidden',
              cursor:          isPositionChanging ? 'grabbing' : 'grab',
              p:               5,
            }}  ref={containerRef}>
            <Paper
              sx={{
                height:          `${canvas.height}px`,
                width:           `${canvas.width}px`,
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

              <CreditsClips height={canvas.height} width={canvas.width} item={item} groupId={''} id={item.id} active={false}/>
            </Paper>
          </Box>
        </Grid>
        <Grid sx={{
          backgroundColor: '#1e1e1e', p: 1, width: '352px',
        }}>
          <SimpleBar style={{
            maxHeight: 'calc(100vh - 70px)', paddingRight: '15px',
          }} autoHide={false}>
            <Stack spacing={0.5}>
              <FormNumericInput
                min={1}
                fullWidth
                value={item.numOfClips}
                label='No. of clips'
                onChange={val => setItem({
                  ...item, numOfClips: val as number,
                })}
              />

              <FormNumericInput
                sx={{
                  '& .MuiInputAdornment-positionStart .MuiInputBase-root': {
                    position: 'relative', top: '4px',
                  },
                  '& .MuiInputAdornment-positionStart .MuiInputBase-root:before': { border: '0 !important' },
                }}
                min={1}
                disabled={item.period === 'stream'}
                value={item.periodValue}
                label='Period'
                InputProps={{
                  startAdornment: <InputAdornment position='start'>
                    <Select
                      variant='standard'
                      onChange={(event) => setItem({
                        ...item, period: event.target.value as typeof item.period,
                      })}
                      value={item.period}
                    >
                      <MenuItem value={'custom'}>Custom</MenuItem>
                      <MenuItem value={'stream'}>Stream</MenuItem>
                    </Select>

                  </InputAdornment>,
                  endAdornment: <InputAdornment position='end'>days</InputAdornment>,
                }}
                onChange={val => {
                  setItem({
                    ...item,
                    periodValue: val as number,
                  });
                }}
              />

              <Box>
                <FormLabel sx={{ marginTop: '30px' }}>{translate('systems.songs.settings.volume')}</FormLabel>
                <Slider
                  value={item.volume}
                  max={100}
                  valueLabelDisplay="on"
                  valueLabelFormat={(value) => `${value}%`}
                  size='small'
                  onChange={(_, newValue) => setItem({
                    ...item, volume: Number(newValue),
                  })}
                />
              </Box>

              <Divider variant='middle'/>

              <AccordionFont
                disableExample
                label='Game font'
                accordionId='gameFont'
                model={item.gameFont}
                open={accordion}
                onClick={(val) => typeof val === 'string' && setAccordion(val)}
                onChange={(val) => {
                  setItem({
                    ...item, gameFont: val,
                  });
                }}/>
              <AccordionFont
                disableExample
                label='Title font'
                accordionId='titleFont'
                model={item.titleFont}
                open={accordion}
                onClick={(val) => typeof val === 'string' && setAccordion(val)}
                onChange={(val) => {
                  setItem({
                    ...item, titleFont: val,
                  });
                }}/>
              <AccordionFont
                disableExample
                label='Created by font'
                accordionId='createdByFont'
                model={item.createdByFont}
                open={accordion}
                onClick={(val) => typeof val === 'string' && setAccordion(val)}
                onChange={(val) => {
                  setItem({
                    ...item, createdByFont: val,
                  });
                }}/>
            </Stack>
          </SimpleBar>
        </Grid>
      </Grid>
    </DialogContent>
    <Divider/>
  </>);
};