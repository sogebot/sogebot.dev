import { Draggable } from '@hello-pangea/dnd';
import { DragIndicator, Edit } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import { Button, Collapse, Container, Divider, Drawer, FormControl, Grid, IconButton, InputLabel, MenuItem, Paper, Select, Stack, Table, TableBody, TableCell, TableContainer, TableRow, TextField, Tooltip, Typography } from '@mui/material';
import { Box } from '@mui/system';
import { Countdown, Marathon, Stopwatch } from '@sogebot/backend/dest/database/entity/overlay';
import { QuickActions } from '@sogebot/backend/src/database/entity/dashboard';
import axios from 'axios';
import HTMLReactParser from 'html-react-parser';
import { cloneDeep } from 'lodash';
import orderBy from 'lodash/orderBy';
import React from 'react';
import { SliderPicker } from 'react-color';

import { getContrastColor, getRandomColor } from '../../../../../colors';
import getAccessToken from '../../../../../getAccessToken';
import { getSocket } from '../../../../../helpers/socket';
import { useAppDispatch, useAppSelector } from '../../../../../hooks/useAppDispatch';
import { setCountdowns, setMarathons, setRandomizers, setStopwatchs } from '../../../../../store/quickActionsSlice';
import { isHexColor } from '../../../../../validators';
import { DeleteButton } from '../../../../Buttons/DeleteButton';
import { DroppableComponent } from '../../../../Table/DroppableComponent';
import { TableCellKeepWidth } from '../../../../Table/TableCellKeepWidth';
import { DashboardWidgetActionButtonsAddItem } from '../Buttons/AddItem';
import { GenerateTime } from '../GenerateTime';

const reorder = (list: QuickActions.Item[], startIndex: number, endIndex: number) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);

  return result;
};

export const RenderList: React.FC<{ label?: string, id: string | number | null }> = ({
  label, id,
}) => {
  return id && (String(id).length > 0)
    ? <Typography sx={{ fontWeight: label ? 'bold' : 'inherit' }} component='span'>
      {label ? HTMLReactParser(label) : '?'}
      <Typography sx={{
        fontWeight: 'normal', fontSize: '12px', fontStyle: 'italic', pl: 1,
      }} component='span'>
        {id}
      </Typography>
    </Typography>
    : <Typography sx={{
      fontWeight: 'normal', fontSize: '12px', fontStyle: 'italic',
    }} component='span'>
      not set up
    </Typography>;
};

const DraggableComponent: React.FC<{
  item: QuickActions.Item, index: number, actions: QuickActions.Item[], setActions: (value: QuickActions.Item[]) => void,
  editingItem: string, setEditingItem: (value:string) => void, children: any,
}> = ({
  item, index, actions, setActions, editingItem, setEditingItem, ...props
}) => {

  const [updateItem, setUpdateItem] = React.useState(item);
  const [isSaving, setIsSaving] = React.useState(false);

  const { randomizers, countdowns, stopwatchs, marathons } = useAppSelector(state => state.quickaction);

  const onChange = React.useCallback((obj: any) => {
    const update = cloneDeep(updateItem);
    update.options.color = obj.hex;
    setUpdateItem(update);
  }, [ updateItem ]);

  const onLabelChange = React.useCallback((value: string) => {
    const update = cloneDeep(updateItem);
    update.options.label = value;
    setUpdateItem(update);
  }, [ updateItem ]);

  const onInputChange = React.useCallback((value: string) => {
    const update = cloneDeep(updateItem);
    if (update.type === 'command') {
      update.options.command = value;
    }
    if (update.type === 'customvariable') {
      update.options.customvariable = value;
    }
    if (update.type === 'randomizer') {
      update.options.randomizerId = value;
    }
    if (update.type === 'overlayCountdown') {
      update.options.countdownId = value;
    }
    if (update.type === 'overlayMarathon') {
      update.options.marathonId = value;
    }
    if (update.type === 'overlayStopwatch') {
      update.options.stopwatchId = value;
    }
    setUpdateItem(update);
  }, [ updateItem ]);

  const deleteItem = () => {
    getSocket('/widgets/quickaction').emit('generic::deleteById', updateItem.id, (err) => {
      if (err) {
        console.error(err);
      }
      setActions(orderBy([...actions.filter(o => o.id !== item.id)], 'order', 'asc'));
      setEditingItem('');
    });
  };

  const handleReset = () => {
    setUpdateItem(item);
    setEditingItem('');
  };

  const handleSubmit = () => {
    setIsSaving(true);
    getSocket('/widgets/quickaction').emit('generic::save', updateItem, (err) => {
      if (err) {
        console.error(err);
      }
      setIsSaving(false);
      setActions(orderBy([...actions.filter(o => o.id !== item.id), updateItem], 'order', 'asc'));
      setEditingItem('');
    });
  };

  return (
    <Draggable draggableId={item.id} index={index} key={item.id}>
      {(provided, snapshot) => (
        <React.Fragment key={item.id + index}>
          <TableRow
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...props}
          >
            <TableCellKeepWidth dragHandleProps={provided.dragHandleProps} snapshot={snapshot} ><DragIndicator/></TableCellKeepWidth>
            {props.children.map((child: React.DetailedReactHTMLElement<any, HTMLElement>, idx: number) => {
              return (<React.Fragment key={'child' + idx}>
                {React.cloneElement(child, {
                  provided, snapshot,
                })}
              </React.Fragment>);
            })}
            <TableCellKeepWidth snapshot={snapshot} sx={{ textAlign: 'right' }}>
              <IconButton onClick={() => setEditingItem(editingItem === updateItem.id ? '' : updateItem.id)}>
                <Edit/>
              </IconButton>
              <DeleteButton onDelete={() => deleteItem()}/>
            </TableCellKeepWidth>
          </TableRow>

          <TableRow>
            <TableCell style={{
              paddingBottom: 0, paddingTop: 0,
            }} colSpan={5}>
              <Collapse in={editingItem === updateItem.id}>
                <Box sx={{
                  width: '100%', p: 2,
                }}>
                  <Grid container spacing={2} justifyContent='center'>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        variant='filled'
                        label="Label"
                        onChange={(event) => onLabelChange(event.target.value)}
                        value={updateItem.options.label}
                      />
                      {updateItem.type === 'command'
                        && <TextField
                          fullWidth
                          variant='filled'
                          label="Command"
                          onChange={(event) => onInputChange(event.target.value)}
                          value={updateItem.options.command}
                        />
                      }
                      {updateItem.type === 'customvariable'
                        && <TextField
                          fullWidth
                          variant='filled'
                          label="Custom variable"
                          onChange={(event) => onInputChange(event.target.value)}
                          value={updateItem.options.customvariable}
                        />
                      }
                      {updateItem.type === 'randomizer'
                        && <FormControl variant="filled" sx={{ width: '100%' }}>
                          <InputLabel id="demo-simple-select-standard-label">Randomizer</InputLabel>
                          <Select
                            fullWidth
                            labelId="demo-simple-select-standard-label"
                            id="demo-simple-select-standard"
                            value={updateItem.options.randomizerId}
                            label="Randomizer"
                            onChange={(event) => onInputChange(event.target.value)}
                          >
                            <MenuItem value='' key='' sx={{ fontSize: '14px' }}><em>--- deselect value ---</em></MenuItem>
                            {randomizers.map(val => <MenuItem value={val.id} key={val.id}>
                              <RenderList label={val.label} id={val.id}/>
                            </MenuItem>)}
                          </Select>
                        </FormControl>}
                      {updateItem.type === 'overlayCountdown'
                        && <FormControl variant="filled" sx={{ width: '100%' }}>
                          <InputLabel id="demo-simple-select-standard-label">Countdown</InputLabel>
                          <Select
                            fullWidth
                            labelId="demo-simple-select-standard-label"
                            id="demo-simple-select-standard"
                            value={updateItem.options.countdownId}
                            label="Countdown"
                            onChange={(event) => onInputChange(event.target.value)}
                          >
                            <MenuItem value='' key='' sx={{ fontSize: '14px' }}><em>--- deselect value ---</em></MenuItem>
                            {countdowns.map(val => <MenuItem value={val.id} key={val.id}>
                              <RenderList label={val.label} id={val.id}/>
                            </MenuItem>)}
                          </Select>
                        </FormControl>}
                      {updateItem.type === 'overlayMarathon'
                        && <FormControl variant="filled" sx={{ width: '100%' }}>
                          <InputLabel id="demo-simple-select-standard-label">Marathon</InputLabel>
                          <Select
                            fullWidth
                            labelId="demo-simple-select-standard-label"
                            id="demo-simple-select-standard"
                            value={updateItem.options.marathonId}
                            label="Marathon"
                            onChange={(event) => onInputChange(event.target.value)}
                          >
                            <MenuItem value='' key='' sx={{ fontSize: '14px' }}><em>--- deselect value ---</em></MenuItem>
                            {marathons.map(val => <MenuItem value={val.id} key={val.id}>
                              <RenderList label={val.label} id={val.id}/>
                            </MenuItem>)}
                          </Select>
                        </FormControl>}
                      {updateItem.type === 'overlayStopwatch'
                        && <FormControl variant="filled" sx={{ width: '100%' }}>
                          <InputLabel id="demo-simple-select-standard-label">Stopwatch</InputLabel>
                          <Select
                            fullWidth
                            labelId="demo-simple-select-standard-label"
                            id="demo-simple-select-standard"
                            value={updateItem.options.stopwatchId}
                            label="Stopwatch"
                            onChange={(event) => onInputChange(event.target.value)}
                          >
                            <MenuItem value='' key='' sx={{ fontSize: '14px' }}>--- deselect value ---</MenuItem>
                            {stopwatchs.map(val => <MenuItem value={val.id} key={val.id}>
                              <RenderList label={val.label} id={val.id}/>
                            </MenuItem>)}
                          </Select>
                        </FormControl>}
                      <Paper sx={{
                        backgroundColor: 'rgba(255, 255, 255, 0.09)', px: '12px', pt: 1,
                      }}>
                        <Stack spacing={2} sx={{ pb: 1 }}>
                          <InputLabel sx={{
                            color:         'rgba(255, 255, 255, 0.7)',
                            fontWeight:    '400',
                            fontSize:      '12px !important',
                            lineHeight:    '1.4375em',
                            letterSpacing: '0.00938em',
                          }}>Button Color</InputLabel>
                          <SliderPicker onChangeComplete={onChange} color={isHexColor(updateItem.options.color) ? updateItem.options.color : '#111111'}/>

                          <Stack spacing={2} direction="row">
                            <Button onClick={handleReset} fullWidth>Cancel</Button>
                            <LoadingButton variant="contained" fullWidth loading={isSaving} onClick={() => handleSubmit()}>Save</LoadingButton>
                          </Stack>
                        </Stack>
                      </Paper>
                    </Grid>
                  </Grid>
                </Box>
              </Collapse>
            </TableCell>
          </TableRow>
        </React.Fragment>
      )}
    </Draggable>
  );
};

export const DashboardWidgetBotDialogActionsEdit: React.FC<{ onClose: () => void }> = ({
  onClose,
}) => {
  const dispatch = useAppDispatch();
  const [ open, setOpen ] = React.useState(false);
  const { user } = useAppSelector(state => state.user);
  const [ actions, setActions ] = React.useState<QuickActions.Item[]>([]);

  const { randomizers, countdowns, marathons, stopwatchs } = useAppSelector(state => state.quickaction);
  const [ editingItem, setEditingItem ] = React.useState('');

  const onDragEnd = (result: { destination: { index: number; }; source: { index: number; }; }) => {
    // dropped outside the list
    if (!result.destination) {
      return;
    }

    const items = reorder(
      actions,
      result.source.index,
      result.destination.index,
    );

    for(let i =0; i < items.length; i++) {
      items[i].order = i;
    }

    setActions(items);

    for (const item of items) {
      getSocket('/widgets/quickaction').emit('generic::save', item, (err) => {
        if (err) {
          console.error(err);
        }
      });
    }
  };

  React.useEffect(() => {
    if (!user) {
      return;
    }
    getSocket('/widgets/quickaction').emit('generic::getAll', user.id, (err, items) => {
      if (err) {
        return console.error(err);
      }
      setActions(orderBy(items, 'order', 'asc'));
    });

    axios.get(`${JSON.parse(localStorage.server)}/api/registries/randomizer`, { headers: { authorization: `Bearer ${getAccessToken()}` } })
      .then(({ data }) => {
        dispatch(setRandomizers(data.data.map((o: any) => ({
          id: o.id, label: o.name,
        }))));
      });

    getSocket('/registries/overlays').emit('generic::getAll', (err, result) => {
      if (err) {
        return console.error(err);
      }
      const _countdowns: { id: string, label: string }[] = [];
      const _marathons: { id: string, label: string }[] = [];
      const _stopwatches: { id: string, label: string }[] = [];

      for (const item of result) {
        _countdowns.push(...item.items.filter(o => o.opts.typeId === 'countdown').map(o => ({
          id: o.id, label: `${item.name} | ${GenerateTime((o.opts as Countdown).time, (o.opts as Countdown).showMilliseconds)}`,
        })));
        _marathons.push(...item.items.filter(o => o.opts.typeId === 'marathon').map(o => ({
          id: o.id, label: `${item.name} | ${GenerateTime(Math.max(Math.max((o.opts as Marathon).endTime, Date.now() - Date.now())), (o.opts as Marathon).showMilliseconds)}`,
        })));
        _stopwatches.push(...item.items.filter(o => o.opts.typeId === 'stopwatch').map(o => ({
          id: o.id, label: `${item.name} | ${GenerateTime((o.opts as Stopwatch).currentTime, (o.opts as Stopwatch).showMilliseconds)}`,
        })));
      }
      dispatch(setCountdowns(_countdowns));
      dispatch(setMarathons(_marathons));
      dispatch(setStopwatchs(_stopwatches));
    });

    if (!open) {
      onClose();
    }
  }, [user, open, onClose, dispatch ]);

  const addItem = React.useCallback((itemType: QuickActions.Item['type']) => {
    const defaultValues = {
      'command':          { command: '' },
      'customvariable':   { customvariable: '' },
      'overlayMarathon':  { marathonId: '' },
      'overlayStopwatch': { stopwatchId: '' },
      'overlayCountdown': { countdownId: '' },
      'randomizer':       { randomizerId: '' },
    } as const;

    const item: any = {
      id:      crypto.randomUUID(),
      userId:  user?.id,
      order:   actions.length,
      type:    itemType,
      options: {
        color: getRandomColor(),
        label: '',
        ...defaultValues[itemType],
      },
    };

    getSocket('/widgets/quickaction').emit('generic::save', item, (err) => {
      if (err) {
        console.error(err);
      }
    });
    setActions([...actions, item]);
    setEditingItem(item.id);
  }, [ actions, user ]);

  return (
    <>
      <Tooltip title="Edit Actions">
        <IconButton onClick={() => setOpen(true)}>
          <Edit/>
        </IconButton>
      </Tooltip>

      <Drawer
        open={open}
        anchor="right"
        onClose={() => setOpen(false)}
        sx={{
          flexShrink:           0,
          '& .MuiDrawer-paper': {
            width:     800,
            boxSizing: 'border-box',
          },
        }}
      >
        <Container disableGutters sx={{
          p: 1, height: 'calc(100% - 50px)', maxHeight: 'calc(100% - 50px)', overflow: 'auto',
        }}>
          <TableContainer component={Paper}>
            <Table size="small" >
              <TableBody component={DroppableComponent(onDragEnd)}>
                {actions.map((item, index) => {
                  return (
                    <DraggableComponent key={item.id + 'draggableComponent'} item={item} index={index} actions={actions} setActions={setActions} editingItem={editingItem} setEditingItem={setEditingItem}>
                      <TableCellKeepWidth><Typography variant="button">{item.type}</Typography></TableCellKeepWidth>
                      <TableCellKeepWidth
                        sx={{
                          backgroundColor: isHexColor(item.options.color) === true ? item.options.color : '#444444',
                          color:           getContrastColor(isHexColor(item.options.color) === true ? item.options.color : '#444444'),
                        }}>
                        {item.type === 'command'
                          ? item.options.label
                          : ''
                        }
                      </TableCellKeepWidth>
                      <TableCellKeepWidth sx={{
                        maxWidth: '280px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {item.type === 'command' && item.options.command}
                        {item.type === 'customvariable' && item.options.customvariable}
                        {item.type === 'randomizer' && <RenderList label={randomizers.find(o => o.id === item.options.randomizerId)?.label} id={item.options.randomizerId}/>}
                        {item.type === 'overlayCountdown' && <RenderList label={countdowns.find(o => o.id === item.options.countdownId)?.label} id={item.options.countdownId}/>}
                        {item.type === 'overlayMarathon' && <RenderList label={marathons.find(o => o.id === item.options.marathonId)?.label} id={item.options.marathonId}/>}
                        {item.type === 'overlayStopwatch' && <RenderList label={stopwatchs.find(o => o.id === item.options.stopwatchId)?.label} id={item.options.stopwatchId}/>}
                      </TableCellKeepWidth>
                    </DraggableComponent>
                  );
                },
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Container>
        <Divider/>
        <Box sx={{
          height: '50px', p: 1,
        }}>
          <Grid container sx={{ height: '100%' }} spacing={1}>
            <Grid item flexGrow={1}>
              <DashboardWidgetActionButtonsAddItem onItemAdd={(itemType) => addItem(itemType)}/>
            </Grid>
            <Grid item xs={'auto'}><Button sx={{ width: '150px' }} onClick={() => setOpen(false)}>Close</Button></Grid>
          </Grid>
        </Box>
      </Drawer>
    </>
  );
};
