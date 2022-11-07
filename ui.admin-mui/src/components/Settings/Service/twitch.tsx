import { Alert, LoadingButton } from '@mui/lab';
import {
  Backdrop,
  Box,
  CircularProgress,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import Collapse  from '@mui/material/Collapse';
import Select from '@mui/material/Select/Select';
import { SxProps, Theme } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  useCallback, useEffect, useMemo,
} from 'react';
import { useSelector } from 'react-redux';
import { useRefElement } from 'rooks';

import { useSettings } from '~/src/hooks/useSettings';
import { useTranslation } from '~/src/hooks/useTranslation';

const PageSettingsModulesServiceTwitch: React.FC<{
  onVisible: () => void,
  sx?: SxProps<Theme> | undefined
}> = ({
  onVisible,
  sx,
}) => {
  const router = useRouter();
  const { settings, loading, refresh, save, saving, handleChange } = useSettings('/services/twitch');
  const { translate } = useTranslation();

  useEffect(() => {
    refresh();
  }, [ router, refresh ]);

  const handleSave = useCallback(async () => {
    // save settings
    save();
  }, [ save ]);

  const [ref, element]  = useRefElement<HTMLElement>();
  const scrollY = useSelector<number, number>((state: any) => state.page.scrollY);
  useEffect(() => {
    if (element) {
      if (element.offsetTop < scrollY + 100 && element.offsetTop + element.clientHeight > scrollY - 100) {
        onVisible();
      }
    }
  }, [element, scrollY, onVisible]);

  const redirectUri = useMemo(() => {
    return `${window.location.origin}/credentials/oauth/tokens`;
  }, []);

  return (<Box ref={ref} sx={sx} id="twitch">
    <Typography variant='h1' sx={{ pb: 2 }}>Twitch</Typography>
    <Typography variant='h2' sx={{ pb: 2 }}>{translate('categories.oauth')}</Typography>
    <Typography variant='h5' sx={{ pb: 2 }}>{translate('categories.general')}</Typography>
    {settings && <Paper elevation={1} sx={{
      p: 1, mb: 2,
    }}>
      <Stack spacing={1}>
        <FormControl fullWidth variant='filled'>
          <InputLabel id="token-generator-label">Token Generator</InputLabel>
          <Select
            labelId="token-generator-label"
            id="token-generator-select"
            variant='filled'
            value={settings.general.tokenService[0]}
            label="Token Generator"
            onChange={(event) => handleChange('general.tokenService', event.target.value)}
          >
            <MenuItem value='SogeBot Token Generator'>SogeBot Token Generator</MenuItem>
            <MenuItem value='Own Twitch App'>Own Twitch App</MenuItem>
          </Select>
          <FormHelperText>If you change token generator, you need to re-do all tokens!</FormHelperText>
        </FormControl>

        <Collapse in={settings.general.tokenService[0] === 'Own Twitch App'} unmountOnExit>
          <Stack spacing={1}>
            <Alert severity="info" icon={false}>
              <ol>
                <li>Go to <Link
                  href="https://dev.twitch.tv/console/apps"
                  target="_blank" rel="noreferrer"
                >https://dev.twitch.tv/console/apps</Link> and register your app</li>
                <li>You can choose any <strong>name</strong> of app you want</li>
                <li>Set <strong>oauth redirect</strong> to your { redirectUri }</li>
                <li>Pick Application Integration for <strong>category</strong> and create</li>
                <li>After creation copy clientId and generate clientSecret</li>
              </ol></Alert>
            <TextField
              variant='filled'
              fullWidth
              value={settings.general.tokenServiceCustomClientId[0]}
              label='Client ID'
              onChange={(event) => handleChange('general.tokenServiceCustomClientId', event.target.value)}
            />
            <TextField
              variant='filled'
              fullWidth
              type="password"
              helperText='Never share your Client Secret!'
              value={settings.general.tokenServiceCustomClientSecret[0]}
              label='Client Secret'
              onChange={(event) => handleChange('general.tokenServiceCustomClientSecret', event.target.value)}
            />
          </Stack>
        </Collapse>

        <TextField
          variant='filled'
          multiline
          fullWidth
          value={settings.general.generalOwners[0].join('\n')}
          helperText={translate('one-record-per-line')}
          label={translate('core.oauth.settings.generalOwners')}
          onChange={(event) => handleChange('general.generalOwners', event.target.value.split('\n'))}
        />
      </Stack>
    </Paper>}

    <Typography variant='h5' sx={{ pb: 2 }}>{translate('categories.bot')}</Typography>

    <Typography variant='h5' sx={{ pb: 2 }}>{translate('categories.channel')}</Typography>
    {settings && <Paper>
    </Paper>}

    <Typography variant='h2' sx={{ pb: 2 }}>{translate('categories.eventsub')}</Typography>
    {settings && <Paper>
    </Paper>}

    <Typography variant='h2' sx={{ pb: 2 }}>{translate('categories.general')}</Typography>
    {settings && <Paper>
    </Paper>}

    <Stack direction='row' justifyContent='center' sx={{ pt: 2 }}>
      <LoadingButton sx={{ width: 300 }} variant='contained' loading={saving} type="submit" onClick={handleSave}>Save changes</LoadingButton>
    </Stack>

    <Backdrop open={loading} >
      <CircularProgress color="inherit"/>
    </Backdrop>
  </Box>
  );
};
export default PageSettingsModulesServiceTwitch;
