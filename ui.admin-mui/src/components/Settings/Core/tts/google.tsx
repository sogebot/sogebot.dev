import { GooglePrivateKeysInterface } from '@entity/google';
import { LoadingButton } from '@mui/lab';
import { Button, Dialog, DialogActions, DialogContent, FormControl, InputLabel, MenuItem, Select, Typography } from '@mui/material';
import axios from 'axios';
import React, { useEffect, useState } from 'react';

import getAccessToken from '../../../../getAccessToken';
import { getConfiguration } from '../../../../helpers/socket';
import { useAppDispatch } from '../../../../hooks/useAppDispatch';
import { useSettings } from '../../../../hooks/useSettings';
import { setConfiguration } from '../../../../store/loaderSlice';

type Props = {
  dialog: boolean;
} | {
  settings: Record<string, any>;
  handleChange: (key: string, value: any) => void;
};

const TTSGoogle: React.FC<Props> = (props) => {
  const [open, setOpen] = React.useState(false);
  const { save, saving, handleChange, settings, refresh } = useSettings('/core/tts');
  const dispatch = useAppDispatch();

  const handleClose = () => {
    setOpen(false);
  };

  const [ privateKeys, setPrivateKeys ] = useState<GooglePrivateKeysInterface[]>([]);

  useEffect(() => {
    axios.get(`/api/services/google/privatekeys`, { headers: { authorization: `Bearer ${getAccessToken()}` } })
      .then((response) => setPrivateKeys(response.data.data));
  }, []);

  useEffect(() => {
    if ('dialog' in props) {
      refresh();
    }
  }, []);

  useEffect(() => {
    if (!saving) {
      getConfiguration().then(conf => dispatch(setConfiguration(conf))).finally(() => handleClose());
    }
  }, [ saving ]);

  return (<>
    {'dialog' in props
      ? <>
        <Button onClick={() => setOpen(true)}>Configure</Button>
        <Dialog open={open} onClose={handleClose} aria-labelledby="form-dialog-title" maxWidth='md' fullWidth>
          {settings && <DialogContent>
            <FormControl fullWidth variant="filled">
              <InputLabel id="private-key-label" shrink>Google Private Key</InputLabel>
              <Select
                labelId="private-key-label"
                id="private-key-select"
                value={settings.googlePrivateKey[0]}
                label='Google Private Key'
                displayEmpty
                onChange={(event) => handleChange('googlePrivateKey', event.target.value)}
              >
                <MenuItem value={''}><em>None</em></MenuItem>
                {privateKeys.map(key => <MenuItem key={key.id} value={key.id}>
                  <Typography component={'span'} fontWeight={'bold'}>{ key.clientEmail }</Typography>
                  <Typography component={'span'} fontSize={12} pl={1}>{ key.id }</Typography>
                </MenuItem>)}
              </Select>
            </FormControl>
          </DialogContent>}
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <LoadingButton loading={saving} onClick={save}>Save changes</LoadingButton>
          </DialogActions>
        </Dialog>
      </>
      : <FormControl  variant="filled" sx={{ minWidth: 300 }}>
        <InputLabel id="private-key-label" shrink>Google Private Key</InputLabel>
        <Select
          labelId="private-key-label"
          id="private-key-select"
          value={props.settings.googlePrivateKey[0]}
          label='Google Private Key'
          displayEmpty
          onChange={(event) => props.handleChange('googlePrivateKey', event.target.value)}
        >
          <MenuItem value={''}><em>None</em></MenuItem>
          {privateKeys.map(key => <MenuItem key={key.id} value={key.id}>
            <Typography component={'span'} fontWeight={'bold'}>{ key.clientEmail }</Typography>
            <Typography component={'span'} fontSize={12} pl={1}>{ key.id }</Typography>
          </MenuItem>)}
        </Select>
      </FormControl>}
  </>
  );
};

export { TTSGoogle };
