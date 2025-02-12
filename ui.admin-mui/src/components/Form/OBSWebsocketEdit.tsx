import Editor, { useMonaco } from '@monaco-editor/react';
import { LoadingButton } from '@mui/lab';
import { Box, Button, Collapse, DialogActions, DialogContent, Grid, LinearProgress, TextField } from '@mui/material';
import { OBSWebsocket } from '@sogebot/backend/dest/database/entity/obswebsocket';
import axios from 'axios';
import { cloneDeep } from 'lodash';
import { nanoid } from 'nanoid';
import { useSnackbar } from 'notistack';
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import getAccessToken from '../../getAccessToken';
import { useTranslation } from '../../hooks/useTranslation';

const createInitialItem = async () => {
  const response = await fetch(`${JSON.parse(localStorage.server)}/assets/obswebsocket-code.txt`);
  return Object.assign(new OBSWebsocket(), {
    id:   nanoid(),
    name: '',
    code: await response.text(),
  });
};

export const OBSWebsocketEdit: React.FC<{
  id?:     string,
  onSave?: () => void,
}> = ({ id, onSave }) => {
  const navigate = useNavigate();
  const { translate } = useTranslation();
  const [ item, setItem ] = useState<OBSWebsocket>();
  const [ loading, setLoading ] = useState(true);
  const [ saving, setSaving ] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const monaco = useMonaco();

  useEffect(() => {
    const libUri = 'ts:filename/global.d.ts';
    const libSource = `
      declare function log(text: string): void;
      declare function waitMs(miliseconds: number): Promise<void>;
    `;
    monaco?.languages.typescript.javascriptDefaults.setCompilerOptions({
      allowNonTsExtensions: true,
      allowJs:              true,
      lib:                  ['es2020'],
    });
    try {
      // When resolving definitions and references, the editor will try to use created models.
      // Creating a model for the library allows "peek definition/references" commands to work with the library.
      monaco?.editor.createModel(libSource, 'typescript', monaco.Uri.parse(libUri));

      // bot typings
      monaco?.languages.typescript.javascriptDefaults.addExtraLib(libSource, libUri);
    } catch {
      return;
    }
  }, [monaco]);

  const handleValueChange = useCallback(<T extends keyof OBSWebsocket>(key: T, value: OBSWebsocket[T]) => {
    if (!item) {
      return;
    }
    const update = cloneDeep(item);
    update[key] = value;
    setItem(update);
  }, [ item ]);

  const [ scriptIsRunning, setScriptIsRunning ] = useState(false);
  const handleRunScript = useCallback(() => {
    if (!item) {
      return;
    }
    setScriptIsRunning(true);

    axios.post(`/api/integrations/obswebsocket?_action=trigger`, { code: item.code }, {
      headers: {
        Authorization: `Bearer ${getAccessToken()}`
      }
    })
      .then(() => enqueueSnackbar('Test done!', { variant: 'success' }))
      .catch(err => {
        console.error({ err });
        enqueueSnackbar('Something went wrong. Check the logs.', { variant: 'error' });
      })
      .finally(() => setScriptIsRunning(false));
  }, [ item, enqueueSnackbar ]);

  useEffect(() => {
    setLoading(true);
    if (id) {
      axios.get(`/api/integrations/obswebsocket/${id}`, {
        headers: {
          Authorization: `Bearer ${getAccessToken()}`
        }
      })
        .then(({ data }) => {
          setItem(data.data);
          setLoading(false);
        })
        .catch(() => {
          enqueueSnackbar('Something went wrong during data loading.');
          navigate(`/registry/obswebsocket/?server=${JSON.parse(localStorage.server)}`);
        });
    } else {
      createInitialItem()
        .then(setItem)
        .finally(() => setLoading(false));
    }
  }, [navigate, id, enqueueSnackbar]);

  const handleClose = () => {
    navigate(`/registry/obswebsocket/?server=${JSON.parse(localStorage.server)}`);
  };

  const handleSave = useCallback(() => {
    if (!item) {
      return;
    }
    setSaving(true);
    axios.post(`/api/integrations/obswebsocket`, item, {
      headers: {
        Authorization: `Bearer ${getAccessToken()}`
      }
    })
      .then(({ data }) => {
        enqueueSnackbar('OBS Websocket script saved.', { variant: 'success' });
        // replace url and add cid to item
        setItem(() => {
          item.id = data.data.id;
          return item;
        });
        const asPath = `/registry/obswebsocket/edit/${data.data.id}?server=${JSON.parse(localStorage.server)}`;
        window.history.replaceState(null, '', asPath);
        if (onSave) {
          onSave();
        }
        setSaving(false);
      });
  }, [ item, onSave, enqueueSnackbar ]);

  return(<>
    {loading && <LinearProgress />}
    <Collapse in={!loading} mountOnEnter unmountOnExit>
      <DialogContent dividers>
        <Box
          component="form"
          sx={{ '& .MuiFormControl-root': { my: 0.5 } }}
          noValidate
          autoComplete="off"
        >
          <TextField
            fullWidth
            variant="filled"
            required
            value={item?.name || ''}
            label={translate('name')}
            onChange={(event) => handleValueChange('name', event.target.value)}
          />

          <Editor
            height="78vh"
            width={`100%`}
            language={'javascript'}
            defaultValue={item?.code || ''}
            theme='vs-dark'
            onChange={value => handleValueChange('code', value || '')}
          />
        </Box>
      </DialogContent>
    </Collapse>
    <DialogActions>
      {!loading ? <>
        <Grid container sx={{ height: '100%' }} justifyContent={'end'} spacing={1}>
          <Grid item>
            <LoadingButton loading={scriptIsRunning} sx={{ width: 150 }} color='light' variant='contained' onClick={handleRunScript}>Run Script</LoadingButton>
          </Grid>
          <Grid item>
            <Button sx={{ width: 150 }} onClick={handleClose}>Close</Button>
          </Grid>
          <Grid item>
            <LoadingButton variant='contained' color='primary' sx={{ width: 150 }} onClick={handleSave} loading={saving}>Save</LoadingButton>
          </Grid>
        </Grid>
      </>
        : <Grid container sx={{ height: '100%' }} justifyContent={'end'} spacing={1}>
          <Grid item>
            <Button sx={{ width: 150 }} onClick={handleClose}>Close</Button>
          </Grid>
        </Grid>}
    </DialogActions>
  </>);
};