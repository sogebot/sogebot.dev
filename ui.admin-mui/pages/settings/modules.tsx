import {
  Backdrop,
  Box,
  CircularProgress,
  Grid,
  List,
  ListItemButton,
  ListItemText,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/router';
import { useSnackbar } from 'notistack';
import {
  ReactElement, useCallback, useEffect, useMemo, useState,
} from 'react';
import { possibleLists } from '~/../backend/d.ts/src/helpers/socket';

import { NextPageWithLayout } from '~/pages/_app';
import { Layout } from '~/src/components/Layout/main';
import PageSettingsModulesCoreCurrency from '~/src/components/Settings/currency';
import PageSettingsModulesCoreDashboard from '~/src/components/Settings/dashboard';
import PageSettingsModulesCoreEmotes from '~/src/components/Settings/emotes';
import PageSettingsModulesCoreGeneral from '~/src/components/Settings/general';
import PageSettingsModulesCoreSocket from '~/src/components/Settings/socket';
import PageSettingsModulesCoreTTS from '~/src/components/Settings/tts';
import PageSettingsModulesCoreUI from '~/src/components/Settings/ui';
import PageSettingsModulesCoreUpdater from '~/src/components/Settings/updater';
import { getSocket } from '~/src/helpers/socket';
import { useTranslation } from '~/src/hooks/useTranslation';

type systemFromIO = { name: string; enabled: boolean; areDependenciesEnabled: boolean; isDisabledByEnv: boolean, type: string };

const canBeDisabled = (item: systemFromIO) => {
  return item.type !== 'core' && item.type !== 'services' && item.enabled !== undefined && item.enabled !== null;
};
const haveAnySettings = (item: systemFromIO) => {
  const configurableList = [
    'core|dashboard', 'core|tts', 'core|emotes', 'core|currency',
    'core|general', 'core|socket', 'core|updater', 'core|ui',

    'services|google', 'services|twitch',

    'systems|antihateraid', 'systems|points', 'systems|checklist',
    'systems|cooldown', 'systems|highlights', 'systems|polls',
    'systems|emotescombo', 'systems|songs', 'systems|moderation',
    'systems|bets', 'systems|scrim', 'systems|raffles',
    'systems|levels', 'systems|userinfo', 'systems|raffles',

    'integrations|donatello', 'integrations|kofi', 'integrations|tiltify',
    'integrations|discord', 'integrations|donationalerts', 'integrations|lastfm',
    'integrations|obswebsocket', 'integrations|pubg', 'integrations|qiwi',
    'integrations|spotify', 'integrations|streamelements', 'integrations|stramlabs',
    'integrations|tipeeestream', 'integrations|twitter',

    'games|fightme', 'games|duel', 'games|gamble',
    'games|heist', 'games|roulette', 'games|seppuku',
  ];
  return configurableList.includes(`${item.type}|${item.name}`);
};
const canBeDisabledOrHaveSettings = (item: systemFromIO) => {
  return canBeDisabled(item) || haveAnySettings(item);
};

const PageSettingsPermissions: NextPageWithLayout = () => {
  const router = useRouter();
  const { translate } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();

  const types: possibleLists[] = useMemo(() => ['core', 'services', 'systems', 'integrations', 'games'], []);
  const [items, setItems] = useState([] as systemFromIO[]);

  const [ loading, setLoading ] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    setItems([]);
    await Promise.all(
      types.map((type) => new Promise<void>((resolve, reject) => {
        getSocket('/').emit('populateListOf', type, (err, systems) => {
          if (err) {
            enqueueSnackbar(String(err), { variant: 'error' });
            reject();
            return;
          }

          setItems(i => ([
            ...i,
            ...systems.sort((a, b) => {
              return translate('menu.' + a.name).localeCompare(translate('menu.' + b.name));
            }) as any,
          ]));

          resolve();
          setLoading(false);
        });

      }))
    );
  }, [ enqueueSnackbar, translate, types ]);

  useEffect(() => {
    refresh();
  }, [ refresh ]);

  useEffect(() => {
    if (router.asPath === '/settings/modules') {
      router.push('/settings/modules/core');
    }
  }, [ router ]);

  /* const toggle = useCallback((item: systemFromIO) => {
    const enabled = !item.enabled;
    getSocket(`/${item.type}/${item.name}` as any).emit('settings.update', { enabled }, (err: Error | null) => {
      if (err) {
        console.error(err);
        enqueueSnackbar(String(err), { variant: 'error' });
        return;
      } else {
        enqueueSnackbar(`Module ${item.name} ${enabled ? 'enabled' : 'disabled'}.`, { variant: enabled ? 'success' : 'info' });
      }
    });
  }, [ enqueueSnackbar ]); */

  const scrollTo = useCallback((type: string, id: string) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: 'smooth',
      block:    'start',
    });
    history.pushState({}, '', `/settings/modules/${type}#${id}`);
  }, [ ]);

  const [ activeTab, setActiveTab ] = useState('');

  return (
    <>
      <Backdrop open={loading} >
        <CircularProgress color="inherit"/>
      </Backdrop>

      <Grid container spacing={1} id="top">
        <Grid item xs={2}>
          <List
            sx={{
              width: '100%', bgcolor: 'background.paper', position: 'sticky', top: '0px',
            }}
            dense
          >
            {types.map(type => <ListItemButton
              sx={{ height: '40px' }}
              selected={router.asPath.includes(`/settings/modules/${type}`)}
              onClick={() => router.push(`/settings/modules/${type}`)}
              key={type}>
              <ListItemText primary={<Typography variant='h5'>{translate('menu.' + type)}</Typography>} />
            </ListItemButton>)}
          </List>
        </Grid>
        <Grid item xs={2}>
          <List
            sx={{
              width: '100%', maxWidth: 360, bgcolor: 'background.paper', position: 'sticky', top: '0px',
            }}
            dense
          >
            {items.filter(o => o.type === 'core' && canBeDisabledOrHaveSettings(o)).map(item =><ListItemButton
              sx={{ height: '40px' }}
              key={`core-${item.name}`}
              selected={activeTab === `${item.type}-${item.name}`}
              onClick={() => scrollTo(item.type, item.name)}
            >
              <ListItemText primary={<Typography variant='h6' sx={{ fontSize: '16px !important' }}>{translate('menu.' + item.name)}</Typography>} />
            </ListItemButton>)}
          </List>
        </Grid>
        <Grid item xs>
          <Box sx={{ maxWidth: 960 }}>
            <PageSettingsModulesCoreDashboard onVisible={() => setActiveTab('core-dashboard')} onTop={() => scrollTo('core', 'top')}/>
            <PageSettingsModulesCoreTTS onVisible={() => setActiveTab('core-tts')} onTop={() => scrollTo('core', 'top')}/>
            <PageSettingsModulesCoreEmotes onVisible={() => setActiveTab('core-emotes')} onTop={() => scrollTo('core', 'top')}/>
            <PageSettingsModulesCoreCurrency onVisible={() => setActiveTab('core-currency')} onTop={() => scrollTo('core', 'top')}/>
            <PageSettingsModulesCoreGeneral onVisible={() => setActiveTab('core-general')} onTop={() => scrollTo('core', 'top')}/>
            <PageSettingsModulesCoreSocket onVisible={() => setActiveTab('core-socket')} onTop={() => scrollTo('core', 'top')}/>
            <PageSettingsModulesCoreUpdater onVisible={() => setActiveTab('core-updater')} onTop={() => scrollTo('core', 'top')}/>
            <PageSettingsModulesCoreUI sx={{ minHeight: '92.3vh' }} onVisible={() => setActiveTab('core-ui')} onTop={() => scrollTo('core', 'top')}/>
          </Box>
        </Grid>
      </Grid>
    </>
  );
};

PageSettingsPermissions.getLayout = function getLayout(page: ReactElement) {
  return (
    <Layout>
      {page}
    </Layout>
  );
};

export default PageSettingsPermissions;
