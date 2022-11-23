import { ArrowUpwardTwoTone } from '@mui/icons-material';
import {
  Backdrop,
  Box,
  CircularProgress,
  Container,
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
import PageSettingsModulesIntegrationsDiscord from '~/src/components/Settings/Integrations/discord';
import PageSettingsModulesIntegrationsDonatello from '~/src/components/Settings/Integrations/donatello';
import PageSettingsModulesIntegrationsDonationAlerts from '~/src/components/Settings/Integrations/donationalerts';
import PageSettingsModulesIntegrationsKofi from '~/src/components/Settings/Integrations/kofi';
import PageSettingsModulesIntegrationsLastFM from '~/src/components/Settings/Integrations/lastfm';
import PageSettingsModulesIntegrationsModules from '~/src/components/Settings/Integrations/modules';
import PageSettingsModulesIntegrationsTiltify from '~/src/components/Settings/Integrations/tiltify';
import PageSettingsModulesServiceGoogle from '~/src/components/Settings/Service/google';
import PageSettingsModulesServiceTwitch from '~/src/components/Settings/Service/twitch';
import PageSettingsModulesSystemsAntihateRaid from '~/src/components/Settings/Systems/antihateraid';
import PageSettingsModulesSystemsBets from '~/src/components/Settings/Systems/bets';
import PageSettingsModulesSystemsChecklist from '~/src/components/Settings/Systems/checklist';
import PageSettingsModulesSystemsCooldown from '~/src/components/Settings/Systems/cooldown';
import PageSettingsModulesSystemsEmotesCombo from '~/src/components/Settings/Systems/emotescombo';
import PageSettingsModulesSystemsHighlights from '~/src/components/Settings/Systems/highlights';
import PageSettingsModulesSystemsLevels from '~/src/components/Settings/Systems/levels';
import PageSettingsModulesSystemsModeration from '~/src/components/Settings/Systems/moderation';
import PageSettingsModulesSystemsModules from '~/src/components/Settings/Systems/modules';
import PageSettingsModulesSystemsPoints from '~/src/components/Settings/Systems/points';
import PageSettingsModulesSystemsPolls from '~/src/components/Settings/Systems/polls';
import PageSettingsModulesSystemsRaffles from '~/src/components/Settings/Systems/raffles';
import PageSettingsModulesSystemsScrim from '~/src/components/Settings/Systems/scrim';
import PageSettingsModulesSystemsSongs from '~/src/components/Settings/Systems/songs';
import PageSettingsModulesSystemsUserinfo from '~/src/components/Settings/Systems/userinfo';
import { useTranslation } from '~/src/hooks/useTranslation';

const PageSettingsModules: NextPageWithLayout = () => {
  const router = useRouter();
  const { translate } = useTranslation();

  const scrollY = useSelector<number, number>((state: any) => state.page.scrollY);
  const settingsLoadingInProgress = useSelector<string[], string[]>((state: any) => state.loader.settingsLoadingInProgress);

  const scrollTo = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: 'smooth',
      block:    'start',
    });
    history.pushState({}, '', `${router.asPath}#${id}`);
  }, [ router ]);

  useEffect(() => {
    if (settingsLoadingInProgress.length === 0) {
      setTimeout(() => {
        const id = router.asPath.split('#')[router.asPath.split('#').length - 1];
        if (id) {
          document.getElementById(id)?.scrollIntoView({
            behavior: 'smooth',
            block:    'start',
          });
        }
      }, 500);
    }
  }, [settingsLoadingInProgress, scrollTo, router]);

  const [ activeTab, setActiveTab ] = useState('');
  const matches = useMediaQuery('(min-width:1536px)');

  useEffect(() => {
    if (router.route === '/settings/modules' || router.route === '/settings/modules/') {
      router.push(`/settings/modules/core/?server=${localStorage.server}`);
    }
  }, [router]);

  return (
    <Container>
      <Grid container spacing={1} id="top">
        <Grid item xs={6} sm={6} md={6} lg={3} xl={2}>
          <List
            sx={{
              width: '100%', bgcolor: 'background.paper', position: 'sticky', top: '0px', padding: 0,
            }}
            dense
          >
            {router.asPath.includes(`/settings/modules/core`) && <>
              {['dashboard', 'tts', 'emotes', 'currency', 'general', 'socket', 'updater', 'ui'].map(item => <ListItemButton
                sx={{ height: '40px' }}
                key={`core-${item}`}
                selected={activeTab === `core-${item}`}
                onClick={() => scrollTo(item)}
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
                onClick={() => scrollTo(item)}
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
                onClick={() => scrollTo(item)}
              >
                <ListItemText primary={<Typography variant='h6' sx={{ fontSize: '16px !important' }}>
                  {translate('menu.' + item).startsWith('{') ? capitalize(item) : translate('menu.' + item)}
                </Typography>} />
              </ListItemButton>)}
            </>}

            {router.asPath.includes(`/settings/modules/integrations`) && <>
              {[
                'donatello', 'kofi', 'tiltify', 'discord', 'donationalerts',
                'lastfm',
              ].map(item => <ListItemButton
                sx={{ height: '40px' }}
                key={`integrations-${item}`}
                selected={activeTab === `integrations-${item}`}
                onClick={() => scrollTo(item)}
              >
                <ListItemText primary={<Typography variant='h6' sx={{ fontSize: '16px !important' }}>
                  {translate('menu.' + item).startsWith('{') ? capitalize(item) : translate('menu.' + item)}
                </Typography>} />
              </ListItemButton>)}
            </>}

            {router.asPath.includes(`/settings/modules/games`) && <>
              {['duel', 'gamble',
                'heist', 'roulette'].map(item => <ListItemButton
                sx={{ height: '40px' }}
                key={`games-${item}`}
                selected={activeTab === `games-${item}`}
                onClick={() => scrollTo(item)}
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
            <Backdrop open={settingsLoadingInProgress.length > 0} >
              <CircularProgress color="inherit"/>
            </Backdrop>
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
                <PageSettingsModulesSystemsModeration onVisible={() => setActiveTab('systems-moderation')}/>
                <PageSettingsModulesSystemsPoints onVisible={() => setActiveTab('systems-points')}/>
                <PageSettingsModulesSystemsPolls onVisible={() => setActiveTab('systems-polls')}/>
                <PageSettingsModulesSystemsRaffles onVisible={() => setActiveTab('systems-raffles')}/>
                <PageSettingsModulesSystemsScrim onVisible={() => setActiveTab('systems-scrim')}/>
                <PageSettingsModulesSystemsSongs onVisible={() => setActiveTab('systems-songs')}/>
                <PageSettingsModulesSystemsUserinfo onVisible={() => setActiveTab('systems-userinfo')}/>
              </>}
              {router.asPath.includes(`/settings/modules/integrations`) && <>
                <PageSettingsModulesIntegrationsModules onVisible={() => setActiveTab('integrations-modules')}/>
                <PageSettingsModulesIntegrationsDonatello onVisible={() => setActiveTab('integrations-donatello')}/>
                <PageSettingsModulesIntegrationsKofi onVisible={() => setActiveTab('integrations-kofi')}/>
                <PageSettingsModulesIntegrationsTiltify onVisible={() => setActiveTab('integrations-tiltify')}/>
                <PageSettingsModulesIntegrationsDiscord onVisible={() => setActiveTab('integrations-discord')}/>
                <PageSettingsModulesIntegrationsDonationAlerts onVisible={() => setActiveTab('integrations-donationalerts')}/>
                <PageSettingsModulesIntegrationsLastFM onVisible={() => setActiveTab('integrations-lastfm')}/>
              </>
              }
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
        onClick={() => scrollTo('top')}>
        <ArrowUpwardTwoTone/>
      </Fab>
      </Slide >
    </Container>
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
