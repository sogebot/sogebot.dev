import {
  Chip,
  Divider,
  FormControl,
  FormControlLabel,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { Eventlist } from '@sogebot/backend/dest/database/entity/overlay';
import React from 'react';

import { AccordionFont } from '../../Accordion/Font';

type Props = {
  model: Eventlist;
  onUpdate: (value: Eventlist) => void;
};

export const EventlistSettings: React.FC<Props> = ({ model, onUpdate }) => {
  const [ open, setOpen ] = React.useState('');

  return <>
    <Stack spacing={0.5}>
      <FormControl fullWidth variant="filled" >
        <InputLabel id="type-select-label">Order</InputLabel>
        <Select
          MenuProps={{ PaperProps: { sx: { maxHeight: 200 } } }}
          label="Order"
          labelId="type-select-label"
          value={model.order}
          onChange={(ev) => onUpdate({
            ...model, order: ev.target.value as 'asc',
          })}
        >
          <MenuItem value="asc" key="asc">asc</MenuItem>
          <MenuItem value="desc" key="desc">desc</MenuItem>
        </Select>
      </FormControl>

      <FormControl fullWidth variant="filled" >
        <InputLabel id="display-select-label">Display</InputLabel>
        <Select
          label="Display"
          multiple
          labelId="display-select-label"
          value={model.display}
          renderValue={o => o.map((i: any) => <Chip sx={{ mr: 1 }} size='small' color="primary" label={i} key={i}/>)}
          onChange={(ev) => onUpdate({
            ...model, display: (ev.target.value ?? []) as typeof model.display,
          })}
        >
          <MenuItem value='username'>username</MenuItem>
          <MenuItem value='event'>event</MenuItem>
        </Select>
      </FormControl>

      <TextField
        label={'Count'}
        fullWidth
        variant="filled"
        value={model.count}
        inputProps={{ min: 1 }}
        type="number"
        onChange={(ev) => {
          if (!isNaN(Number(ev.currentTarget.value))) {
            onUpdate({
              ...model, count: Number(ev.currentTarget.value),
            });
          }
        }}
      />

      <TextField
        label={'Space between items'}
        fullWidth
        variant="filled"
        value={model.spaceBetweenItems}
        type="number"
        InputProps={{ endAdornment: <InputAdornment position='end'>px</InputAdornment> }}
        onChange={(ev) => {
          if (!isNaN(Number(ev.currentTarget.value))) {
            onUpdate({
              ...model, spaceBetweenItems: Number(ev.currentTarget.value),
            });
          }
        }}
      />

      <TextField
        label={'Space between event and username'}
        fullWidth
        variant="filled"
        value={model.spaceBetweenEventAndUsername}
        type="number"
        InputProps={{ endAdornment: <InputAdornment position='end'>px</InputAdornment> }}
        onChange={(ev) => {
          if (!isNaN(Number(ev.currentTarget.value))) {
            onUpdate({
              ...model, spaceBetweenEventAndUsername: Number(ev.currentTarget.value),
            });
          }
        }}
      />

      <FormControlLabel sx={{
        width: '100%', pt: 1,
      }} control={<Switch checked={model.inline} onChange={(_, checked) => onUpdate({
        ...model, inline: checked,
      })} />} label={<>
        <Typography>Horizontal mode</Typography>
      </>}/>

      <FormControlLabel sx={{
        width: '100%', alignItems: 'self-start', pt: 1,
      }} control={<Switch checked={model.fadeOut} onChange={(_, checked) => onUpdate({
        ...model, fadeOut: checked,
      })} />} label={<>
        <Typography>Fade out</Typography>
        <Typography variant='body2' sx={{ fontSize: '12px' }}>{model.fadeOut
          ? 'Items will decrease opacity.'
          : 'All items will have 100% opacity.'
        }</Typography>
      </>}/>
    </Stack>

    <Divider variant='middle'/>

    <AccordionFont
      disableExample
      label='Event font'
      accordionId='eventFont'
      model={model.eventFont}
      open={open}
      onClick={(val) => typeof val === 'string' && setOpen(val)}
      onChange={(val) => {
        onUpdate({
          ...model, eventFont: val,
        });
      }}/>
    <Divider variant='middle'/>

    <AccordionFont
      disableExample
      label='Username font'
      accordionId='usernameFont'
      model={model.usernameFont}
      open={open}
      onClick={(val) => typeof val === 'string' && setOpen(val)}
      onChange={(val) => {
        onUpdate({
          ...model, usernameFont: val,
        });
      }}/>
  </>;
};