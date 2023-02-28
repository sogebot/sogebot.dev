import { DeleteTwoTone } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Box,
  Button,
  Checkbox,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { SxProps, Theme } from '@mui/material/styles';
import { GooglePrivateKeysInterface } from '@sogebot/backend/dest/database/entity/google';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import React, {
  useCallback, useEffect, useMemo, useState,
} from 'react';
import { useSelector } from 'react-redux';
import { useRefElement } from 'rooks';
import { v4 } from 'uuid';

import getAccessToken from '../../../getAccessToken';
import { dayjs } from '../../../helpers/dayjsHelper';
import { getBase64FromUrl } from '../../../helpers/getBase64FromURL';
import { getSocket } from '../../../helpers/socket';
import { useSettings } from '../../../hooks/useSettings';
import { useTranslation } from '../../../hooks/useTranslation';

declare namespace stream {

  export interface Snippet {
    publishedAt: Date;
    channelId: string;
    title: string;
    description: string;
    isDefaultStream: boolean;
  }

  export interface IngestionInfo {
    streamName: string;
    ingestionAddress: string;
    backupIngestionAddress: string;
    rtmpsIngestionAddress: string;
    rtmpsBackupIngestionAddress: string;
  }

  export interface Cdn {
    ingestionType: string;
    ingestionInfo: IngestionInfo;
    resolution: string;
    frameRate: string;
  }

  export interface HealthStatus {
    status: string;
  }

  export interface Status {
    streamStatus: string;
    healthStatus: HealthStatus;
  }

  export interface RootObject {
    kind: string;
    etag: string;
    id: string;
    snippet: Snippet;
    cdn: Cdn;
    status: Status;
  }

}

const PageSettingsModulesServiceGoogle: React.FC<{
  onVisible: () => void,
  sx?: SxProps<Theme> | undefined
}> = ({
  onVisible,
  sx,
}) => {

  const { settings, loading, refresh, save, saving, handleChange } = useSettings('/services/google');
  const { translate } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();

  const [ privateKeys, setPrivateKeys ] = useState<GooglePrivateKeysInterface[]>([]);
  const [ privateKeysCache, setPrivateKeysCache ] = useState<GooglePrivateKeysInterface[]>([]);

  const [ streams, setStreams ] = useState<stream.RootObject[]>([]);

  const refreshKeys = useCallback(async () => {
    await Promise.all([
      new Promise<void>(resolve => {
        axios.get(`${JSON.parse(localStorage.server)}/api/services/google/privatekeys`, { headers: { authorization: `Bearer ${getAccessToken()}` } })
          .then(({ data }) => {
            console.log({ data });
            setPrivateKeys([...data.data]);
            setPrivateKeysCache([...data.data]);
            resolve();
          });
      }),
    ]);
  }, []);

  const refreshStreams = useCallback(async () => {
    await Promise.all([
      new Promise<void>(resolve => {
        axios.get(`${JSON.parse(localStorage.server)}/api/services/google/streams`, { headers: { authorization: `Bearer ${getAccessToken()}` } })
          .then(({ data }) => {
            console.log({ data });
            setStreams([...data.data]);
            resolve();
          });
      }),
    ]);
  }, []);

  useEffect(() => {
    refresh();
    refreshKeys();
    refreshStreams();
  }, [ refresh, refreshKeys, refreshStreams ]);

  const [ saving2, setSaving2 ] = useState(false);
  const handleSave = useCallback(async () => {
    setSaving2(true);
    // save settings
    save();

    // upload privateKeys
    for (const key of privateKeys) {
      if (key.privateKey) {
        // if contain private key, we must save it do db
        await axios.post(`${JSON.parse(localStorage.server)}/api/services/google/privatekeys`, {
          id:          key.id,
          clientEmail: key.clientEmail,
          privateKey:  key.privateKey,
          createdAt:   key.createdAt,
        }, { headers: { authorization: `Bearer ${getAccessToken()}` } });
      }
    }
    // go through private keys vs cache to delete keys
    for (const key of privateKeysCache) {
      if (!privateKeys.find(o => o.id === key.id)) {
        axios.delete(`${JSON.parse(localStorage.server)}/api/services/google/privatekeys/${key.id}`, { headers: { authorization: `Bearer ${getAccessToken()}` } });
      }
    }
    setSaving2(false);
  }, [ save, privateKeys, privateKeysCache ]);

  const [ uploading, setUploading ] = useState(false);
  const [refUploadInput, elementUploadInput]  = useRefElement<HTMLElement>();

  const filesChange = useCallback(async (filesUpload: HTMLInputElement['files']) => {
    if (!filesUpload) {
      return;
    }
    setUploading(true);

    for (const file of filesUpload) {
      try {
        const base64 = (await getBase64FromUrl(URL.createObjectURL(file))).split(',')[1];
        const text = JSON.parse(atob(base64));
        if (!text.client_email || !text.private_key) {
          throw new Error(`Invalid JSON file ${file.name}.`);
        }
        setPrivateKeys(keys => [...keys, {
          id:          v4(),
          clientEmail: text.client_email,
          privateKey:  text.private_key,
          createdAt:   new Date().toISOString(),
        }]);
      } catch (e) {
        if (e instanceof Error) {
          enqueueSnackbar(e.message, { variant: 'error' });
          console.error(e);
        }
      }
    }
    setUploading(false);
  }, [ enqueueSnackbar ]);

  const [ref, element]  = useRefElement<HTMLElement>();
  const scrollY = useSelector<number, number>((state: any) => state.page.scrollY);
  useEffect(() => {
    if (element) {
      if (element.offsetTop < scrollY + 100 && element.offsetTop + element.clientHeight > scrollY - 100) {
        onVisible();
      }
    }
  }, [element, scrollY, onVisible]);

  const removePrivateKey = (id: string | undefined) => {
    if (id) {
      setPrivateKeys(values => values.filter(o => o.id !== id));
    }
  };

  const revoke = useCallback(() => {
    getSocket('/services/google').emit('google::revoke', () => {
      enqueueSnackbar('User access revoked.', { variant: 'success' });
      refresh();
    });
  }, [ enqueueSnackbar, refresh ]);

  const authorize = useCallback(() => {
    const popup = window.open((process.env.PUBLIC_URL !== '/' ? window.location.origin + '/' : process.env.PUBLIC_URL) + 'credentials/google', 'popup', 'popup=true,width=500,height=500,toolbar=no,location=no,status=no,menubar=no');
    const checkPopup = setInterval(() => {
      if (!popup || popup.closed) {
        enqueueSnackbar('User logged in.', { variant: 'success' });
        setTimeout(() => refresh(), 2000);
        clearInterval(checkPopup);
        return;
      }
    }, 1000);
  }, [ enqueueSnackbar, refresh ]);

  const channel = useMemo(() => {
    if (settings && settings.channel[0].length > 0) {
      return settings.channel[0];
    }
    return 'Not Authorized';
  }, [settings]);

  return (loading ? null : <Box ref={ref} sx={sx} id="google">
    <Typography variant='h2' sx={{ pb: 2 }}>Google</Typography>
    <Typography variant='h5' sx={{ pb: 2 }}>YouTube Channel</Typography>
    {settings && <Paper elevation={1} sx={{
      p: 1, mb: 2,
    }}>
      <Stack spacing={1}>
        <TextField
          variant='filled'
          fullWidth
          disabled
          value={channel}
          label={'Channel'}
          InputProps={{
            endAdornment: <InputAdornment position="end">
              { channel !== 'Not Authorized'
                ? <Button color="error" variant="contained" onClick={revoke}>Revoke</Button>
                : <Button color="success" variant="contained" onClick={authorize}>Authorize</Button>
              }
            </InputAdornment>,
          }}
        />
      </Stack>
    </Paper>}

    <Typography variant='h5' sx={{ pb: 2 }}>Stream</Typography>
    {settings && <Paper elevation={1} sx={{
      p: 1, mb: 2,
    }}>
      <Stack spacing={1}>
        <FormControl fullWidth variant='filled'>
          <InputLabel id="rmtp-stream-label" shrink>RTMP key</InputLabel>
          <Select
            labelId="rmtp-stream-label"
            id="rmtp-stream-select"
            displayEmpty
            variant='filled'
            value={settings.streamId[0]}
            label="RTMP key"
            onChange={(event) => handleChange('streamId', event.target.value)}
          >
            <MenuItem value="">No key selected</MenuItem>
            {streams.map(item => <MenuItem value={item.id} key={item.id}>{item.snippet.title}</MenuItem>)}
          </Select>
        </FormControl>

        <Stack direction='row' spacing={1} alignItems='center'>
          <Checkbox onChange={(_, checked) => handleChange('onStreamEndTitleEnabled', checked)} checked={settings.onStreamEndTitleEnabled[0]} />
          <TextField
            variant='filled'
            fullWidth
            helperText="Title can be only 100 chars. Available variables: $gamesList, $title, $date"
            value={settings.onStreamEndTitle[0]}
            disabled={!settings.onStreamEndTitleEnabled[0]}
            label="On Stream End Title"
            onChange={(event) => handleChange('onStreamEndTitle', event.target.value)}
          />
        </Stack>

        <Stack direction='row' spacing={1} alignItems='center'>
          <Checkbox onChange={(_, checked) => handleChange('onStreamEndDescriptionEnabled', checked)} checked={settings.onStreamEndDescriptionEnabled[0]} />
          <TextField
            variant='filled'
            fullWidth
            multiline
            helperText="Description can be only 5000 chars. Available variables: $chapters, $title, $date"
            value={settings.onStreamEndDescription[0]}
            disabled={!settings.onStreamEndDescriptionEnabled[0]}
            label="On Stream End Description"
            onChange={(event) => handleChange('onStreamEndDescription', event.target.value)}
          />
        </Stack>

        <Stack direction='row' spacing={1} alignItems='center'>
          <Checkbox onChange={(_, checked) => handleChange('onStreamEndPrivacyStatusEnabled', checked)} checked={settings.onStreamEndPrivacyStatusEnabled[0]} />

          <FormControl fullWidth variant='filled'>
            <InputLabel id="rmtp-stream-label" shrink>On Stream End Privacy Status</InputLabel>
            <Select
              variant='filled'
              fullWidth
              value={settings.onStreamEndPrivacyStatus[0]}
              disabled={!settings.onStreamEndPrivacyStatusEnabled[0]}
              label="On Stream End Privacy Status"
              onChange={(event) => handleChange('onStreamEndPrivacyStatus', event.target.value)}
            >
              <MenuItem value='private'>Private</MenuItem>
              <MenuItem value='public'>Public</MenuItem>
              <MenuItem value='unlisted'>Unlisted</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Stack>
    </Paper>
    }

    <Typography variant='h5' sx={{ pb: 2 }}>{translate('categories.keys')}</Typography>
    {settings && <Paper>
      <TableContainer>
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>E-mail</TableCell>
              <TableCell>Created At</TableCell>
              <TableCell align="right"></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {privateKeys.map((row) => (
              <TableRow
                key={row.id}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <TableCell component="th" scope="row">
                  {row.id}
                </TableCell>
                <TableCell>
                  {row.clientEmail}
                </TableCell>
                <TableCell>{ dayjs(row.createdAt).format('LL LTS') }</TableCell>
                <TableCell align="right"><IconButton color='error' onClick={() => removePrivateKey(row.id)}><DeleteTwoTone/></IconButton></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <input
        title="File upload"
        ref={refUploadInput}
        type="file"
        multiple
        style={{ display: 'none' }}
        accept="application/json"
        onChange={(event) => filesChange(event.target.files)}
      />

      <LoadingButton sx={{ m: 0.5 }} loading={uploading} onClick={() => elementUploadInput?.click()}>Upload new private key</LoadingButton>
    </Paper>
    }

    <Stack direction='row' justifyContent='center' sx={{ pt: 2 }}>
      <LoadingButton sx={{ width: 300 }} variant='contained' loading={saving || saving2} type="submit" onClick={handleSave}>Save changes</LoadingButton>
    </Stack>
  </Box>
  );
};
export default PageSettingsModulesServiceGoogle;
