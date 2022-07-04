import {
  Box, Button, Checkbox, Divider, Drawer, FormControlLabel, FormGroup, FormHelperText, Grid, TextField, 
} from '@mui/material';
import { capitalize } from 'lodash';
import { useDispatch, useSelector } from 'react-redux';

import translate from '~/src/helpers/translate';

import { toggleBulkDialog } from '../../store/appbarSlice';

export const AliasBulk: React.FC = () => {
  const dispatch = useDispatch();
  const { showBulkDialog } = useSelector((state: any) => state.appbar);

  return(
    <Drawer
      open={showBulkDialog}
      variant="persistent"
      anchor="right"
      sx={{
        flexShrink:           0,
        '& .MuiDrawer-paper': {
          padding:   '10px',
          marginTop: '58px',
          width:     500,
          boxSizing: 'border-box',
        },
      }}
    >
      <Box
        component="form"
        sx={{ '& .MuiTextField-root': { my: 1, width: '100%' } }}
        noValidate
        autoComplete="off"
      >

        <TextField
          variant="filled"
          required
          label={translate('alias')}
        />

        <TextField
          variant="filled"
          required
          label={translate('command')}
        />

        <Grid container>
          <Grid item xs={6}>
            <FormGroup>
              <FormControlLabel control={<Checkbox />} label={translate('enabled')} />
              <FormHelperText sx={{ position: 'relative', top: '-10px' }}>Alias is enabled</FormHelperText>
            </FormGroup>
          </Grid>
          <Grid item xs={6}>
            <FormGroup>
              <FormControlLabel control={<Checkbox />} label={capitalize(translate('visible'))} />
              <FormHelperText sx={{ position: 'relative', top: '-10px' }}>Alias will be visible in lists</FormHelperText>
            </FormGroup>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }}/>
        <Grid container textAlign={'center'}>
          <Grid item xs={6}>
            <Button variant='contained' color='secondary' sx={{ width: 150 }} onClick={() => dispatch(toggleBulkDialog())}>Close</Button>
          </Grid>
          <Grid item xs={6}>
            <Button variant='contained' color='primary' sx={{ width: 150 }}>Save</Button>
          </Grid>
        </Grid>
      </Box>
    </Drawer>
  );
};