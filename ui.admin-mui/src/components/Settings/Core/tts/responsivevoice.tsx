import { LoadingButton } from '@mui/lab';
import { Button, Dialog, DialogActions, DialogContent, TextField } from '@mui/material';
import React, { useEffect } from 'react';

import { getConfiguration } from '../../../../helpers/socket';
import { useAppDispatch } from '../../../../hooks/useAppDispatch';
import { useSettings } from '../../../../hooks/useSettings';
import { useTranslation } from '../../../../hooks/useTranslation';
import { setConfiguration } from '../../../../store/loaderSlice';

type Props = {
  dialog: boolean;
} | {
  settings: Record<string, any>;
  handleChange: (key: string, value: any) => void;
};

const TTSResponsiveVoice: React.FC<Props> = (props) => {
  const [open, setOpen] = React.useState(false);
  const { refresh, save, saving, handleChange, settings } = useSettings('/core/tts');
  const dispatch = useAppDispatch();
  const { translate } = useTranslation();

  const handleClose = () => {
    setOpen(false);
  };

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
            <TextField
              autoFocus
              margin="dense"
              id="name"
              label={translate('integrations.responsivevoice.settings.key.title')}
              helperText={translate('integrations.responsivevoice.settings.key.help')}
              type="password"
              fullWidth
              value={settings.responsiveVoiceKey[0]}
              onChange={(event) => handleChange('responsiveVoiceKey', event.target.value)}
            />
          </DialogContent>}
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <LoadingButton loading={saving} onClick={save}>Save changes</LoadingButton>
          </DialogActions>
        </Dialog>
      </>
      : <TextField
        sx={{ minWidth: 300 }}
        label={translate('integrations.responsivevoice.settings.key.title')}
        helperText={translate('integrations.responsivevoice.settings.key.help')}
        variant="filled"
        type="password"
        value={props.settings.responsiveVoiceKey[0]}
        onChange={(event) => props.handleChange('responsiveVoiceKey', event.target.value)}
      />}
  </>
  );
};

export { TTSResponsiveVoice };
