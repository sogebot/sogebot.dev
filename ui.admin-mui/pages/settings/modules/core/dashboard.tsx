import { CircleTwoTone, ExpandMoreTwoTone } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Backdrop,
  Box,
  CircularProgress,
  Divider,
  FormLabel,
  Grid,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { capitalize } from 'lodash';
import { Twitch } from 'mdi-material-ui';
import { useRouter } from 'next/router';
import { useSnackbar } from 'notistack';
import {
  ReactElement, useCallback, useEffect, useState,
} from 'react';

import { NextPageWithLayout } from '~/pages/_app';
import { Layout } from '~/src/components/Layout/main';
import { saveSettings } from '~/src/helpers/settings';
import { getSocket } from '~/src/helpers/socket';
import { useTranslation } from '~/src/hooks/useTranslation';

const PageSettingsModulesCoreDashboard: NextPageWithLayout = () => {
  const router = useRouter();
  const { translate } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();

  const [ loading, setLoading ] = useState(true);
  const [ settings, setSettings ] = useState<null | Record<string, any>>(null);
  // const [ ui, setUI ] = useState<null | Record<string, any>>(null);

  const cols: Record<string, [number, number, number, number]> = { 'twitch|status': [12, 12, 12, 12] };
  /* const availableµWidgets = [
    'twitch|status',
    'twitch|uptime',
    'twitch|viewers',
    'twitch|maxViewers',
    'twitch|newChatters',
    'twitch|chatMessages',
    'twitch|followers',
    'twitch|subscribers',
    'twitch|bits',
    'general|tips',
    'twitch|watchedTime',
    'general|currentSong',
  ];*/

  const getItemNameWithoutId = (item: string) => {
    const split = item.split('|');
    return `${split[0]}|${split[1]}`;
  };

  const refresh = useCallback(async () => {
    setLoading(true);
    await new Promise<void>((resolve, reject) => {
      getSocket(`/core/dashboard`)
        .emit('settings', (err, _settings: {
          [x: string]: any
        }, /* _ui: {
          [x: string]: {
            [attr: string]: any
          }
        }*/ ) => {
          if (err) {
            reject(err);
            return;
          }
          // setUI(_ui);
          setSettings(_settings);
          resolve();
        });
    });
    setLoading(false);
  }, [ ]);

  useEffect(() => {
    refresh();
  }, [ router, refresh ]);

  const [ expanded, setExpanded ] = useState('panel1');

  const handleChange
    = (panel: string, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : 'no panel');
    };

  const [ saving, setSaving ] = useState(false);
  const save = useCallback(() => {
    if (settings) {
      setSaving(true);
      saveSettings('/core/dashboard', settings)
        .then(() => {
          enqueueSnackbar('Settings saved.', { variant: 'success' });
        })
        .finally(() => setSaving(false));
    }
  }, [ settings, enqueueSnackbar ]);

  return (
    <>
      <Backdrop open={loading} >
        <CircularProgress color="inherit"/>
      </Backdrop>

      {settings && <Accordion expanded={expanded === 'panel1'} onChange={(_, isExpanded) => handleChange('panel1', isExpanded)}>
        <AccordionSummary
          expandIcon={<ExpandMoreTwoTone />}
          aria-controls="panel1a-content"
          id="panel1a-header"
        >
          <Typography>{ translate('categories.general') }</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Divider>
            <FormLabel>µWidgets</FormLabel>
          </Divider>
          <Grid container spacing={1} sx={{ pt: 2 }}>
            {settings.µWidgets[0].map((item: string) => <Grid item key={item}
              xs={cols[getItemNameWithoutId(item)] ? cols[getItemNameWithoutId(item)][0] : 6}
              lg={cols[getItemNameWithoutId(item)] ? cols[getItemNameWithoutId(item)][1] : 2}
              md={cols[getItemNameWithoutId(item)] ? cols[getItemNameWithoutId(item)][2] : 4}
              sm={cols[getItemNameWithoutId(item)] ? cols[getItemNameWithoutId(item)][3] : 4}>
              <Paper variant='outlined' sx={{
                p: 2, pb: 1,
              }}>
                <Stack direction='row' spacing={1}>
                  <Box>
                    { item.split('|')[0] === 'twitch' && <Twitch/> }
                    { item.split('|')[0] === 'general' && <CircleTwoTone/> }
                  </Box>
                  <Box>
                    { capitalize(item.split('|')[1].replace(/([A-Z])/g, '$1')) }
                  </Box>
                </Stack>
              </Paper>
            </Grid>)}
          </Grid>
        </AccordionDetails>
      </Accordion>}

      <Stack direction='row' justifyContent='center'>
        <LoadingButton sx={{ width: 300 }} variant='contained' loading={saving} onClick={save}>Save changes</LoadingButton>
      </Stack>

    </>
  );
};

PageSettingsModulesCoreDashboard.getLayout = function getLayout(page: ReactElement) {
  return (
    <Layout>
      {page}
    </Layout>
  );
};

export default PageSettingsModulesCoreDashboard;
