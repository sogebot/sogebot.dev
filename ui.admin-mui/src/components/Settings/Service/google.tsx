import { GooglePrivateKeysInterface } from '@entity/google';
import { DeleteTwoTone } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Backdrop,
  Box,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { SxProps, Theme } from '@mui/material/styles';
import axios from 'axios';
import { useRouter } from 'next/router';
import { useSnackbar } from 'notistack';
import {
  useCallback, useEffect, useState,
} from 'react';
import { useSelector } from 'react-redux';
import { useRefElement } from 'rooks';
import { v4 } from 'uuid';

import getAccessToken from '~/src/getAccessToken';
import { dayjs } from '~/src/helpers/dayjsHelper';
import { getBase64FromUrl } from '~/src/helpers/getBase64FromURL';
import { useSettings } from '~/src/hooks/useSettings';
import { useTranslation } from '~/src/hooks/useTranslation';

const PageSettingsModulesServiceGoogle: React.FC<{
  onVisible: () => void,
  sx?: SxProps<Theme> | undefined
}> = ({
  onVisible,
  sx,
}) => {
  const router = useRouter();
  const { settings, loading, refresh, save, saving } = useSettings('/services/google');
  const { translate } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();

  const [ privateKeys, setPrivateKeys ] = useState<GooglePrivateKeysInterface[]>([]);
  const [ privateKeysCache, setPrivateKeysCache ] = useState<GooglePrivateKeysInterface[]>([]);

  const refreshKeys = useCallback(async () => {
    await Promise.all([
      new Promise<void>(resolve => {
        axios.get(`${localStorage.server}/api/services/google/privatekeys`, { headers: { authorization: `Bearer ${getAccessToken()}` } })
          .then(({ data }) => {
            console.log({ data });
            setPrivateKeys([...data.data]);
            setPrivateKeysCache([...data.data]);
            resolve();
          });
      }),
    ]);
  }, []);
  useEffect(() => {
    refresh();
    refreshKeys();
  }, [ router, refresh, refreshKeys ]);

  const [ saving2, setSaving2 ] = useState(false);
  const handleSave = useCallback(async () => {
    setSaving2(true);
    // save settings
    save();

    // upload privateKeys
    for (const key of privateKeys) {
      if (key.privateKey) {
        // if contain private key, we must save it do db
        await axios.post(`${localStorage.server}/api/services/google/privatekeys`, {
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
        axios.delete(`${localStorage.server}/api/services/google/privatekeys/${key.id}`, { headers: { authorization: `Bearer ${getAccessToken()}` } });
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

  return (<Box ref={ref} sx={sx} id="google">
    <Typography variant='h1' sx={{ pb: 2 }}>Google</Typography>
    <Typography variant='h2' sx={{ pb: 2 }}>{translate('categories.keys')}</Typography>
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

    <Backdrop open={loading} >
      <CircularProgress color="inherit"/>
    </Backdrop>
  </Box>
  );
};
export default PageSettingsModulesServiceGoogle;
