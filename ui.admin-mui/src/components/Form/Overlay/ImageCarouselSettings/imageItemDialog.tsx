import { SettingsTwoTone } from '@mui/icons-material';
import { Button, FormControl, InputAdornment, InputLabel, MenuItem } from '@mui/material';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { Carousel } from '@sogebot/backend/src/database/entity/overlay';
import * as React from 'react';
import { useLocalstorageState } from 'rooks';

import { useTranslation } from '../../../../hooks/useTranslation';

export function ImageItemDialog(props: {
  image:    Carousel['images'][number],
  onUpdate: (value: Carousel['images'][number]) => void,
  onDelete: () => void,
}) {
  const [open, setOpen] = React.useState(false);
  const [ model, setModel ] = React.useState(props.image);

  const [server] = useLocalstorageState('server', 'https://demobot.sogebot.xyz');
  const { translate } = useTranslation();

  const animationOptions = [
    'fade',
    'blur',
    'slideUp',
    'slideDown',
    'slideLeft',
    'slideRight',
  ];

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleDelete = () => {
    setOpen(false);
    props.onDelete();
  };

  const handleSave = React.useCallback(() => {
    setOpen(false);
    props.onUpdate(model);
  }, [ model ]);

  return (
    <Box sx={{
      position: 'absolute',
      right:    0,
      bottom:   0,
    }}>
      <IconButton onClick={handleClickOpen}><SettingsTwoTone/></IconButton>
      <Dialog open={open} fullWidth maxWidth='sm'>
        <DialogContent>
          <Stack spacing={1}>
            <Box sx={{ width: '100%' }}>
              <img src={`${server}/gallery/${model.url}`} style={{
                height:    '150px',
                width:     '100%',
                objectFit: 'scale-down',
              }}/>
            </Box>

            <TextField
              fullWidth
              variant="filled"
              value={model.duration}
              inputProps={{ min: 0 }}
              type="number"
              label={translate('page.settings.overlays.carousel.titles.duration')}
              InputProps={{ endAdornment: <InputAdornment position='end'>ms</InputAdornment> }}
              onChange={(ev) => {
                if (!isNaN(Number(ev.currentTarget.value))) {
                  setModel({
                    ...model, duration: Number(ev.currentTarget.value),
                  });
                }
              }}
            />

            <Stack direction='row' spacing={1}>
              <TextField
                fullWidth
                variant="filled"
                value={model.waitBefore}
                inputProps={{ min: 0 }}
                type="number"
                label={translate('page.settings.overlays.carousel.titles.waitBefore')}
                InputProps={{ endAdornment: <InputAdornment position='end'>ms</InputAdornment> }}
                onChange={(ev) => {
                  if (!isNaN(Number(ev.currentTarget.value))) {
                    setModel({
                      ...model, waitBefore: Number(ev.currentTarget.value),
                    });
                  }
                }}
              />
              <TextField
                fullWidth
                variant="filled"
                value={model.waitAfter}
                inputProps={{ min: 0 }}
                type="number"
                label={translate('page.settings.overlays.carousel.titles.waitAfter')}
                InputProps={{ endAdornment: <InputAdornment position='end'>ms</InputAdornment> }}
                onChange={(ev) => {
                  if (!isNaN(Number(ev.currentTarget.value))) {
                    setModel({
                      ...model, waitAfter: Number(ev.currentTarget.value),
                    });
                  }
                }}
              />
            </Stack>

            <Stack direction='row' spacing={1}>
              <FormControl fullWidth variant="filled" >
                <InputLabel id="page.settings.overlays.carousel.titles.animationIn">{translate('page.settings.overlays.carousel.titles.animationIn')}</InputLabel>
                <Select
                  MenuProps={{ PaperProps: { sx: { maxHeight: 200 } } }}
                  label={translate('page.settings.overlays.carousel.titles.animationIn')}
                  labelId="page.settings.overlays.carousel.titles.animationIn"
                  value={model.animationIn}
                  onChange={(ev) => setModel({
                    ...model, animationIn: ev.target.value as any,
                  })}
                >
                  {animationOptions.map(o => <MenuItem value={o} key={o}>{o}</MenuItem>)}
                </Select>
              </FormControl>
              <TextField
                fullWidth
                variant="filled"
                value={model.animationInDuration}
                inputProps={{ min: 0 }}
                type="number"
                label={translate('page.settings.overlays.carousel.titles.animationInDuration')}
                InputProps={{ endAdornment: <InputAdornment position='end'>ms</InputAdornment> }}
                onChange={(ev) => {
                  if (!isNaN(Number(ev.currentTarget.value))) {
                    setModel({
                      ...model, animationInDuration: Number(ev.currentTarget.value),
                    });
                  }
                }}
              />
            </Stack>

            <Stack direction='row' spacing={1}>
              <FormControl fullWidth variant="filled" >
                <InputLabel id="page.settings.overlays.carousel.titles.animationOut">{translate('page.settings.overlays.carousel.titles.animationOut')}</InputLabel>
                <Select
                  MenuProps={{ PaperProps: { sx: { maxHeight: 200 } } }}
                  label={translate('page.settings.overlays.carousel.titles.animationOut')}
                  labelId="page.settings.overlays.carousel.titles.animationOut"
                  value={model.animationOut}
                  onChange={(ev) => setModel({
                    ...model, animationOut: ev.target.value as any,
                  })}
                >
                  {animationOptions.map(o => <MenuItem value={o} key={o}>{o}</MenuItem>)}
                </Select>
              </FormControl>
              <TextField
                fullWidth
                variant="filled"
                value={model.animationOutDuration}
                inputProps={{ min: 0 }}
                type="number"
                label={translate('page.settings.overlays.carousel.titles.animationOutDuration')}
                InputProps={{ endAdornment: <InputAdornment position='end'>ms</InputAdornment> }}
                onChange={(ev) => {
                  if (!isNaN(Number(ev.currentTarget.value))) {
                    setModel({
                      ...model, animationOutDuration: Number(ev.currentTarget.value),
                    });
                  }
                }}
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'space-between' }}>
          <Button onClick={handleDelete} color='error'>Delete</Button>
          <Button onClick={handleSave}>{ translate('dialog.buttons.saveChanges.idle') }</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}