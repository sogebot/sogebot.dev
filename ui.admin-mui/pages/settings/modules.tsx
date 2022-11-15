import { ArrowUpwardTwoTone } from '@mui/icons-material';
import {
  Box,
  Fab,
  Grid,
  List,
  ListItemButton,
  ListItemText,
  Slide,
  Typography ,
} from '@mui/material';
import useMediaQuery from '@mui/material/useMediaQuery';
import { Stack } from '@mui/system';
import { capitalize } from 'lodash';
import { useRouter } from 'next/router';
import {
  ReactElement, useCallback, useEffect, useState,
} from 'react';
import { useSelector } from 'react-redux';

import { NextPageWithLayout } from '~/pages/_app';
import { Layout } from '~/src/components/Layout/main';
import PageSettingsModulesCoreCurrency from '~/src/components/Settings/Core/currency';
import PageSettingsModulesCoreDashboard from '~/src/components/Settings/Core/dashboard';
import PageSettingsModulesCoreEmotes from '~/src/components/Settings/Core/emotes';
import PageSettingsModulesCoreGeneral from '~/src/components/Settings/Core/general';
import PageSettingsModulesCoreSocket from '~/src/components/Settings/Core/socket';
import PageSettingsModulesCoreTTS from '~/src/components/Settings/Core/tts';
import PageSettingsModulesCoreUI from '~/src/components/Settings/Core/ui';
import PageSettingsModulesCoreUpdater from '~/src/components/Settings/Core/updater';
import PageSettingsModulesServiceGoogle from '~/src/components/Settings/Service/google';
import PageSettingsModulesServiceTwitch from '~/src/components/Settings/Service/twitch';
import PageSettingsModulesSystemsAntihateRaid from '~/src/components/Settings/Systems/antihateraid';
import PageSettingsModulesSystemsBets from '~/src/components/Settings/Systems/bets';
import PageSettingsModulesSystemsChecklist from '~/src/components/Settings/Systems/checklist';
import PageSettingsModulesSystemsCooldown from '~/src/components/Settings/Systems/cooldown';
import PageSettingsModulesSystemsEmotesCombo from '~/src/components/Settings/Systems/emotescombo';
import PageSettingsModulesSystemsHighlights from '~/src/components/Settings/Systems/highlights';
import PageSettingsModulesSystemsLevels from '~/src/components/Settings/Systems/levels';
import PageSettingsModulesSystemsModules from '~/src/components/Settings/Systems/modules';
import { useTranslation } from '~/src/hooks/useTranslation';

const PageSettingsModules: NextPageWithLayout = () => {
  const router = useRouter();
  const { translate } = useTranslation();
  const scrollY = useSelector<number, number>((state: any) => state.page.scrollY);

  const scrollTo = useCallback((type: string, id: string) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: 'smooth',
      block:    'start',
    });
    history.pushState({}, '', `/settings/modules/${type}#${id}`);
  }, [ ]);

  const [ activeTab, setActiveTab ] = useState('');
  const matches = useMediaQuery('(min-width:1536px)');

  useEffect(() => {
    if (router.asPath === '/settings/modules') {
      router.push('/settings/modules/core');
    }
  }, [router]);

  return (
    <>
      <Grid container spacing={1} id="top">
        <Grid item xs={6} sm={6} md={6} lg={3} xl={2}>
          <List
            sx={{
              width: '100%', bgcolor: 'background.paper', position: 'sticky', top: '0px',
            }}
            dense
          >
            {['core', 'services', 'systems', 'integrations', 'games'].map(type => <ListItemButton
              sx={{ height: '40px' }}
              selected={router.asPath.includes(`/settings/modules/${type}`)}
              onClick={() => router.push(`/settings/modules/${type}`)}
              key={type}>
              <ListItemText primary={<Typography variant='h5'>
                {translate('menu.' + type).startsWith('{') ? type : translate('menu.' + type)}
              </Typography>} />
            </ListItemButton>)}
          </List>
        </Grid>
        <Grid item xs={6} sm={6} md={6} lg={3} xl={2}>
          <List
            sx={{
              width: '100%', bgcolor: 'background.paper', position: 'sticky', top: '0px',
            }}
            dense
          >
            {router.asPath.includes(`/settings/modules/core`) && <>
              {['dashboard', 'tts', 'emotes', 'currency', 'general', 'socket', 'updater', 'ui'].map(item => <ListItemButton
                sx={{ height: '40px' }}
                key={`core-${item}`}
                selected={activeTab === `core-${item}`}
                onClick={() => scrollTo('core', item)}
              >
                <ListItemText primary={<Typography variant='h6' sx={{ fontSize: '16px !important' }}>
                  {translate('menu.' + item).startsWith('{') ? capitalize(item) : translate('menu.' + item)}
                </Typography>} />
              </ListItemButton>)}
            </>}

            {router.asPath.includes(`/settings/modules/services`) && <>
              {['google', 'twitch'].map(item => <ListItemButton
                sx={{ height: '40px' }}
                key={`services-${item}`}
                selected={activeTab === `services-${item}`}
                onClick={() => scrollTo('services', item)}
              >
                <ListItemText primary={<Typography variant='h6' sx={{ fontSize: '16px !important' }}>
                  {translate('menu.' + item).startsWith('{') ? capitalize(item) : translate('menu.' + item)}
                </Typography>} />
              </ListItemButton>)}
            </>}

            {router.asPath.includes(`/settings/modules/systems`) && <>
              {['antihateraid',
                'bets',
                'checklist',
                'cooldown',
                'emotescombo',
                'highlights',
                'levels',
                'moderation',
                'points',
                'polls',
                'raffles',
                'scrim',
                'songs',
                'userinfo'].map(item => <ListItemButton
                sx={{ height: '40px' }}
                key={`systems-${item}`}
                selected={activeTab === `systems-${item}`}
                onClick={() => scrollTo('systems', item)}
              >
                <ListItemText primary={<Typography variant='h6' sx={{ fontSize: '16px !important' }}>
                  {translate('menu.' + item).startsWith('{') ? capitalize(item) : translate('menu.' + item)}
                </Typography>} />
              </ListItemButton>)}
            </>}

            {router.asPath.includes(`/settings/modules/integrations`) && <>
              {['google', 'twitch'].map(item => <ListItemButton
                sx={{ height: '40px' }}
                key={`integrations-${item}`}
                selected={activeTab === `integrations-${item}`}
                onClick={() => scrollTo('integrations', item)}
              >
                <ListItemText primary={<Typography variant='h6' sx={{ fontSize: '16px !important' }}>
                  {translate('menu.' + item).startsWith('{') ? capitalize(item) : translate('menu.' + item)}
                </Typography>} />
              </ListItemButton>)}
            </>}

            {router.asPath.includes(`/settings/modules/games`) && <>
              {['duel', 'gamble',
                'heist', 'roulette', 'seppuku'].map(item => <ListItemButton
                sx={{ height: '40px' }}
                key={`games-${item}`}
                selected={activeTab === `games-${item}`}
                onClick={() => scrollTo('games', item)}
              >
                <ListItemText primary={<Typography variant='h6' sx={{ fontSize: '16px !important' }}>
                  {translate('menu.' + item).startsWith('{') ? capitalize(item) : translate('menu.' + item)}
                </Typography>} />
              </ListItemButton>)}
            </>}
          </List>
        </Grid>
        <Grid item xs>
          <Box sx={{
            maxWidth: 960, m: matches ? undefined : 'auto',
          }}>
            <Stack spacing={4}>
              {router.asPath.includes(`/settings/modules/core`) && <>
                <PageSettingsModulesCoreDashboard onVisible={() => setActiveTab('core-dashboard')}/>
                <PageSettingsModulesCoreTTS onVisible={() => setActiveTab('core-tts')}/>
                <PageSettingsModulesCoreEmotes onVisible={() => setActiveTab('core-emotes')}/>
                <PageSettingsModulesCoreCurrency onVisible={() => setActiveTab('core-currency')}/>
                <PageSettingsModulesCoreGeneral onVisible={() => setActiveTab('core-general')}/>
                <PageSettingsModulesCoreSocket onVisible={() => setActiveTab('core-socket')}/>
                <PageSettingsModulesCoreUpdater onVisible={() => setActiveTab('core-updater')}/>
                <PageSettingsModulesCoreUI onVisible={() => setActiveTab('core-ui')}/>
              </>}
              {router.asPath.includes(`/settings/modules/services`) && <>
                <PageSettingsModulesServiceGoogle onVisible={() => setActiveTab('services-google')}/>
                <PageSettingsModulesServiceTwitch onVisible={() => setActiveTab('services-twitch')}/>
              </>}
              {router.asPath.includes(`/settings/modules/systems`) && <>
                <PageSettingsModulesSystemsModules onVisible={() => setActiveTab('systems-modules')}/>
                <PageSettingsModulesSystemsAntihateRaid onVisible={() => setActiveTab('systems-antihateraid')}/>
                <PageSettingsModulesSystemsBets onVisible={() => setActiveTab('systems-bets')}/>
                <PageSettingsModulesSystemsChecklist onVisible={() => setActiveTab('systems-checklist')}/>
                <PageSettingsModulesSystemsCooldown onVisible={() => setActiveTab('systems-cooldown')}/>
                <PageSettingsModulesSystemsEmotesCombo onVisible={() => setActiveTab('systems-emotescombo')}/>
                <PageSettingsModulesSystemsHighlights onVisible={() => setActiveTab('systems-highlights')}/>
                <PageSettingsModulesSystemsLevels onVisible={() => setActiveTab('systems-levels')}/>
              </>}
              <Box sx={{
                minHeight: '50vh', width: '100%',
              }}/>
            </Stack>
          </Box>
        </Grid>
      </Grid>
      <Slide unmountOnExit direction="up" in={scrollY > 300}><Fab
        color="primary"
        aria-label="top"
        sx={{
          position: 'absolute', bottom: '20px', right: '40px',
        }}
        onClick={() => scrollTo('core', 'top')}>
        <ArrowUpwardTwoTone/>
      </Fab>
      </Slide >
    </>
  );
};

PageSettingsModules.getLayout = function getLayout(page: ReactElement) {
  return (
    <Layout>
      {page}
    </Layout>
  );
};

export default PageSettingsModules;
