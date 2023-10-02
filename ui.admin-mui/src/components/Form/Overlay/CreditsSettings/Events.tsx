import {

  CropFreeTwoTone, ExpandMoreTwoTone, FitScreenTwoTone, ZoomInTwoTone, ZoomOutTwoTone,
} from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box, DialogContent, Divider, FormControl, Unstable_Grid2 as Grid, IconButton, InputAdornment, InputLabel, MenuItem, Paper, Select, Stack, TextField, Tooltip, Typography,
} from '@mui/material';
import { CreditsScreenEvents, Overlay } from '@sogebot/backend/dest/database/entity/overlay';
import { capitalize } from 'lodash';
import React from 'react';
import { useMouse, usePreviousImmediate } from 'rooks';
import SimpleBar from 'simplebar-react';

import { useValidator } from '../../../../hooks/useValidator';
import { AccordionFont, loadFont } from '../../../Accordion/Font';
import { setZoomDimensionViewable } from '../../../Moveable/DimensionViewable';
import { setZoomRemoveButton } from '../../../Moveable/RemoveButton';
import { CreditsEvents, defaultHeaderValues } from '../../../Overlay/CreditsEvents';
import { FormNumericInput } from '../../Input/Numeric';
import { events } from '../AlertSettings/tester';

let isPositionChanging = false;
document.addEventListener('mouseup', () => isPositionChanging = false);

type Props = {
  model: CreditsScreenEvents;
  canvas: { width: number, height: number },
  onUpdate: (value: CreditsScreenEvents) => void;
};

export const CreditsSettingsEvents: React.FC<Props> = ({ model, canvas, onUpdate }) => {
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

  const [ item, setItem ] = React.useState<CreditsScreenEvents>(model);
  React.useEffect(() => {
    onUpdate(item);
  }, [ item ]);

  const { validate } = useValidator();

  React.useEffect(() => {
    loadFont(item.headerFont.family);
    loadFont(item.itemFont.family);
    loadFont(item.highlightFont.family);
  }, [item.headerFont.family, item.highlightFont.family, item.itemFont.family]);

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
                value={'Set automatically by events height'}
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
                height:          `auto`,
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
              <CreditsEvents height={0} width={0} item={item} groupId={''} id={item.id}/>
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
                value={item.columns}
                label='Columns'
                onChange={val => setItem({
                  ...item, columns: val as number,
                })}
              />

              <FormControl fullWidth variant='filled'>
                <InputLabel id="exclude-label">Exclude events</InputLabel>
                <Select
                  labelId="exclude-label"
                  id="exclude-select"
                  multiple
                  variant='filled'
                  value={item.excludeEvents}
                  label={'Exclude events'}
                  onChange={(event) => setItem({
                    ...item, excludeEvents: event.target.value as typeof item.excludeEvents,
                  })}
                >
                  {events.map(ev => <MenuItem value={ev} key={ev}>{ev}</MenuItem>)}
                </Select>
              </FormControl>
              <Divider variant='middle'/>

              <Accordion expanded={accordion === 'headers'}>
                <AccordionSummary
                  expandIcon={<ExpandMoreTwoTone />}
                  onClick={() => setAccordion(accordion === 'headers' ? '' : 'headers')}
                  aria-controls="panel1a-content"
                  id="panel1a-header"
                >
                  <Typography>Headers</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {events.map(it => <TextField
                    sx={{ mb: 0.5 }}
                    label={capitalize(it)}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    placeholder={defaultHeaderValues[it as keyof typeof defaultHeaderValues]}
                    value={it in item.headers ? item.headers[it as keyof typeof item.headers] : ''}
                    onChange={(ev) => {
                      setItem({
                        ...item,
                        headers: {
                          ...item.headers,
                          [it]: ev.currentTarget.value,
                        },
                      });
                    }}
                  />)}
                </AccordionDetails>
              </Accordion>
              <AccordionFont
                disableExample
                label='Header font'
                accordionId='headerFont'
                model={item.headerFont}
                open={accordion}
                onOpenChange={(val) => setAccordion(val)}
                onChange={(val) => {
                  setItem({
                    ...item, headerFont: val,
                  });
                }}/>
              <AccordionFont
                disableExample
                label='Item font'
                accordionId='itemFont'
                model={item.itemFont}
                open={accordion}
                onOpenChange={(val) => setAccordion(val)}
                onChange={(val) => {
                  setItem({
                    ...item, itemFont: val,
                  });
                }}/>
              <AccordionFont
                disableExample
                label='Highlight font'
                accordionId='highlightFont'
                model={item.highlightFont}
                open={accordion}
                onOpenChange={(val) => setAccordion(val)}
                onChange={(val) => {
                  setItem({
                    ...item, highlightFont: val,
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