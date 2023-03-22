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
import React, {
  useCallback, useEffect, useState,
} from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';

import PageSettingsModulesCoreCurrency from '../../components/Settings/Core/currency';
import PageSettingsModulesCoreDashboard from '../../components/Settings/Core/dashboard';
import PageSettingsModulesCoreEmotes from '../../components/Settings/Core/emotes';
import PageSettingsModulesCoreGeneral from '../../components/Settings/Core/general';
import PageSettingsModulesCoreSocket from '../../components/Settings/Core/socket';
import PageSettingsModulesCoreTTS from '../../components/Settings/Core/tts';
import PageSettingsModulesCoreUI from '../../components/Settings/Core/ui';
import PageSettingsModulesCoreUpdater from '../../components/Settings/Core/updater';
import PageSettingsModulesGamesDuel from '../../components/Settings/Games/duel';
import PageSettingsModulesGamesGamble from '../../components/Settings/Games/gamble';
import PageSettingsModulesGamesHeist from '../../components/Settings/Games/heist';
import PageSettingsModulesGamesModules from '../../components/Settings/Games/modules';
import PageSettingsModulesGamesRoulette from '../../components/Settings/Games/roulette';
import PageSettingsModulesIntegrationsDiscord from '../../components/Settings/Integrations/discord';
import PageSettingsModulesIntegrationsDonatello from '../../components/Settings/Integrations/donatello';
import PageSettingsModulesIntegrationsDonationAlerts from '../../components/Settings/Integrations/donationalerts';
import PageSettingsModulesIntegrationsKofi from '../../components/Settings/Integrations/kofi';
import PageSettingsModulesIntegrationsLastFM from '../../components/Settings/Integrations/lastfm';
import PageSettingsModulesIntegrationsModules from '../../components/Settings/Integrations/modules';
import PageSettingsModulesIntegrationsPUBG from '../../components/Settings/Integrations/pubg';
import PageSettingsModulesIntegrationsQiwi from '../../components/Settings/Integrations/qiwi';
import PageSettingsModulesIntegrationsSpotify from '../../components/Settings/Integrations/spotify';
import PageSettingsModulesIntegrationsStreamelements from '../../components/Settings/Integrations/streamelements';
import PageSettingsModulesIntegrationsStreamlabs from '../../components/Settings/Integrations/streamlabs';
import PageSettingsModulesIntegrationsTiltify from '../../components/Settings/Integrations/tiltify';
import PageSettingsModulesIntegrationsTipeeestream from '../../components/Settings/Integrations/tipeeestream';
import PageSettingsModulesServiceGoogle from '../../components/Settings/Service/google';
import PageSettingsModulesServiceTwitch from '../../components/Settings/Service/twitch';
import PageSettingsModulesSystemsAntihateRaid from '../../components/Settings/Systems/antihateraid';
import PageSettingsModulesSystemsBets from '../../components/Settings/Systems/bets';
import PageSettingsModulesSystemsChecklist from '../../components/Settings/Systems/checklist';
import PageSettingsModulesSystemsCooldown from '../../components/Settings/Systems/cooldown';
import PageSettingsModulesSystemsEmotesCombo from '../../components/Settings/Systems/emotescombo';
import PageSettingsModulesSystemsHighlights from '../../components/Settings/Systems/highlights';
import PageSettingsModulesSystemsLevels from '../../components/Settings/Systems/levels';
import PageSettingsModulesSystemsModeration from '../../components/Settings/Systems/moderation';
import PageSettingsModulesSystemsModules from '../../components/Settings/Systems/modules';
import PageSettingsModulesSystemsPoints from '../../components/Settings/Systems/points';
import PageSettingsModulesSystemsRaffles from '../../components/Settings/Systems/raffles';
import PageSettingsModulesSystemsScrim from '../../components/Settings/Systems/scrim';
import PageSettingsModulesSystemsSongs from '../../components/Settings/Systems/songs';
import PageSettingsModulesSystemsUserinfo from '../../components/Settings/Systems/userinfo';
import { useTranslation } from '../../hooks/useTranslation';

const PageSettingsModules = () => {
  const { id, type } = useParams();
  const { translate } = useTranslation();

  const scrollY = useSelector<number, number>((state: any) => state.page.scrollY);
  const settingsLoadingInProgress = useSelector<string[], string[]>((state: any) => state.loader.settingsLoadingInProgress);

  const scrollTo = useCallback((idScroll: string) => {
    document.getElementById(idScroll)?.scrollIntoView({
      behavior: 'smooth',
      block:    'start',
    });
    history.pushState({}, '', `/settings/modules/${type}/${idScroll}?server=${JSON.parse(localStorage.server)}`);
  }, [ type ]);

  useEffect(() => {
    if (settingsLoadingInProgress.length === 0) {
      setTimeout(() => {
        if (id) {
          document.getElementById(id)?.scrollIntoView({
            behavior: 'smooth',
            block:    'start',
          });
        }
      }, 500);
    }
  }, [settingsLoadingInProgress, scrollTo]);

  const [ activeTab, setActiveTab ] = useState('');
  const matches = useMediaQuery('(min-width:1536px)');

  return (
    <Container>
      <Grid container spacing={1} id="top">
        <Grid item xs={12} sm={12} md={3} lg={3} xl={3}>
          <List
            sx={{
              width: '100%', bgcolor: 'background.paper', position: 'sticky', top: '0px', padding: 0,
            }}
            dense
          >
            {type === `core` && <>
              {['dashboard', 'tts', 'emotes', 'currency', 'general', 'socket', 'updater', 'ui'].map(item => <ListItemButton
                key={`core-${item}`}
                selected={activeTab === `core-${item}`}
                onClick={() => scrollTo(item)}
              >
                <ListItemText primary={<Typography variant='h6' sx={{ fontSize: '16px !important' }}>
                  {translate('menu.' + item).startsWith('{') ? capitalize(item) : translate('menu.' + item)}
                </Typography>} />
              </ListItemButton>)}
            </>}

            {type === `services` && <>
              {['google', 'twitch'].map(item => <ListItemButton
                key={`services-${item}`}
                selected={activeTab === `services-${item}`}
                onClick={() => scrollTo(item)}
              >
                <ListItemText primary={<Typography variant='h6' sx={{ fontSize: '16px !important' }}>
                  {translate('menu.' + item).startsWith('{') ? capitalize(item) : translate('menu.' + item)}
                </Typography>} />
              </ListItemButton>)}
            </>}

            {type === `systems` && <>
              {['antihateraid',
                'bets',
                'checklist',
                'cooldown',
                'emotescombo',
                'highlights',
                'levels',
                'moderation',
                'points',
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

            {type === `integrations` && <>
              {[
                'donatello', 'kofi', 'tiltify', 'discord', 'donationalerts',
                'lastfm', 'pubg', 'qiwi', 'spotify', 'streamelements', 'streamlabs',
                'tipeeestream', 'twitter',
              ].map(item => <ListItemButton
                key={`integrations-${item}`}
                selected={activeTab === `integrations-${item}`}
                onClick={() => scrollTo(item)}
              >
                <ListItemText primary={<Typography variant='h6' sx={{ fontSize: '16px !important' }}>
                  {translate('menu.' + item).startsWith('{') ? capitalize(item) : translate('menu.' + item)}
                </Typography>} />
              </ListItemButton>)}
            </>}

            {type === `games` && <>
              {['duel', 'gamble',
                'heist', 'roulette'].map(item => <ListItemButton
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
          <Box sx={{ m: matches ? undefined : 'auto' }}>
            <Backdrop open={settingsLoadingInProgress.length > 0} >
              <CircularProgress color="inherit"/>
            </Backdrop>
            <Stack spacing={4}>
              {type === `core` && <>
                <PageSettingsModulesCoreDashboard onVisible={() => setActiveTab('core-dashboard')}/>
                <PageSettingsModulesCoreTTS onVisible={() => setActiveTab('core-tts')}/>
                <PageSettingsModulesCoreEmotes onVisible={() => setActiveTab('core-emotes')}/>
                <PageSettingsModulesCoreCurrency onVisible={() => setActiveTab('core-currency')}/>
                <PageSettingsModulesCoreGeneral onVisible={() => setActiveTab('core-general')}/>
                <PageSettingsModulesCoreSocket onVisible={() => setActiveTab('core-socket')}/>
                <PageSettingsModulesCoreUpdater onVisible={() => setActiveTab('core-updater')}/>
                <PageSettingsModulesCoreUI onVisible={() => setActiveTab('core-ui')}/>
              </>}
              {type === `services` && <>
                <PageSettingsModulesServiceGoogle onVisible={() => setActiveTab('services-google')}/>
                <PageSettingsModulesServiceTwitch onVisible={() => setActiveTab('services-twitch')}/>
              </>}
              {type === `systems` && <>
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
                <PageSettingsModulesSystemsRaffles onVisible={() => setActiveTab('systems-raffles')}/>
                <PageSettingsModulesSystemsScrim onVisible={() => setActiveTab('systems-scrim')}/>
                <PageSettingsModulesSystemsSongs onVisible={() => setActiveTab('systems-songs')}/>
                <PageSettingsModulesSystemsUserinfo onVisible={() => setActiveTab('systems-userinfo')}/>
              </>}
              {type === `integrations` && <>
                <PageSettingsModulesIntegrationsModules onVisible={() => setActiveTab('integrations-modules')}/>
                <PageSettingsModulesIntegrationsDonatello onVisible={() => setActiveTab('integrations-donatello')}/>
                <PageSettingsModulesIntegrationsKofi onVisible={() => setActiveTab('integrations-kofi')}/>
                <PageSettingsModulesIntegrationsTiltify onVisible={() => setActiveTab('integrations-tiltify')}/>
                <PageSettingsModulesIntegrationsDiscord onVisible={() => setActiveTab('integrations-discord')}/>
                <PageSettingsModulesIntegrationsDonationAlerts onVisible={() => setActiveTab('integrations-donationalerts')}/>
                <PageSettingsModulesIntegrationsLastFM onVisible={() => setActiveTab('integrations-lastfm')}/>
                <PageSettingsModulesIntegrationsPUBG onVisible={() => setActiveTab('integrations-pubg')}/>
                <PageSettingsModulesIntegrationsQiwi onVisible={() => setActiveTab('integrations-qiwi')}/>
                <PageSettingsModulesIntegrationsSpotify onVisible={() => setActiveTab('integrations-spotify')}/>
                <PageSettingsModulesIntegrationsStreamelements onVisible={() => setActiveTab('integrations-streamelements')}/>
                <PageSettingsModulesIntegrationsStreamlabs onVisible={() => setActiveTab('integrations-streamlabs')}/>
                <PageSettingsModulesIntegrationsTipeeestream onVisible={() => setActiveTab('integrations-tipeeestream')}/>
              </>
              }
              {type === `games` && <>
                <PageSettingsModulesGamesModules onVisible={() => setActiveTab('games-modules')}/>
                <PageSettingsModulesGamesDuel onVisible={() => setActiveTab('games-duel')}/>
                <PageSettingsModulesGamesGamble onVisible={() => setActiveTab('games-gamble')}/>
                <PageSettingsModulesGamesHeist onVisible={() => setActiveTab('games-heist')}/>
                <PageSettingsModulesGamesRoulette onVisible={() => setActiveTab('games-roulette')}/>
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
export default PageSettingsModules;
