import { OpenInNewTwoTone } from '@mui/icons-material';
import { TabContext, TabList } from '@mui/lab';
import { Box, Card, IconButton, Tab } from '@mui/material';
import React from 'react';
import { useIntervalWhen, useLocalstorageState } from 'rooks';

import { DashboardWidgetBotChecklist } from './Bot/Checklist';
import { DashboardWidgetBotCustom } from './Bot/Custom';
import { DashboardWidgetBotEvents } from './Bot/Events';
import { DashboardWidgetBotQueue } from './Bot/Queue';
import { DashboardWidgetBotRaffles } from './Bot/Raffles';
import { DashboardWidgetBotYTPlayer } from './Bot/YTPlayer';
import { useAppSelector } from '../../../hooks/useAppDispatch';
import { useTranslation } from '../../../hooks/useTranslation';
import theme from '../../../theme';
import { classes } from '../../styles';

export const DashboardWidgetBot: React.FC = () => {
  const { systems } = useAppSelector((state: any) => state.loader);
  const [server] = useLocalstorageState('server', 'https://demobot.sogebot.xyz');
  const { translate } = useTranslation();

  const [value, setValue] = React.useState('1');

  const [height, setHeight] = React.useState(0);
  const ref = React.createRef<HTMLDivElement>();

  useIntervalWhen(() => {
    if (ref.current) {
      const bodyRect = document.body.getBoundingClientRect();
      const elemRect = ref.current.getBoundingClientRect();
      const offset   = elemRect.top - bodyRect.top;
      setHeight(window.innerHeight - offset - 3);
    }
  }, 1000, true, true);

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
  };

  const popoutURL = window.location.origin + (process.env.REACT_APP_COMMIT ? `/${process.env.REACT_APP_COMMIT}/` : '/') + 'popout/widget/bot?server=' + server;
  const isPopout = window.location.href.includes('/popout/widget/bot');

  return (
    <Card variant="outlined" sx={{ height: height + 'px' }} ref={ref}>
      <TabContext value={value}>
        <Box sx={{
          borderBottom:    1,
          borderColor:     'divider',
          backgroundColor: theme.palette.grey[900],
          height:          '48px',
        }}>
          <Box height={48} sx={{
            display: 'flex', alignItems: 'center',
          }}>
            <TabList onChange={handleChange} variant='scrollable' scrollButtons="auto" sx={{ flexGrow: 1 }}>
              <Tab label={translate('widget-title-eventlist')} value="1" />
              {(systems || []).find((o: any) => o.name === 'songs').enabled && <Tab label={translate('widget-title-ytplayer')} value="2" />}
              <Tab label={translate('widget-title-queue')} value="3" />
              <Tab label={translate('widget-title-raffles')} value="4"/>
              <Tab label={translate('menu.checklist')} value="5" />
              <Tab label={translate('widget-title-custom')} value="6" />
            </TabList>
            {!isPopout && <IconButton sx={{ height: '40px' }}
              target="popup"
              onClick={(ev) => {
                ev.preventDefault();
                window.open(popoutURL, 'popup', 'popup=true,width=500,height=500,toolbar=no,location=no,status=no,menubar=no');
              } }
              href={popoutURL}>
              <OpenInNewTwoTone/>
            </IconButton>}
          </Box>
        </Box>
        <Box sx={{
          position: 'relative', height: 'calc(100% - 48px);',
        }}>
          <DashboardWidgetBotEvents sx={value === '1' ? classes.showTab : classes.hideTab}/>
          <DashboardWidgetBotYTPlayer sx={value === '2' ? classes.showTab : classes.hideTab}/>
          <DashboardWidgetBotQueue sx={value === '3' ? classes.showTab : classes.hideTab}/>
          <DashboardWidgetBotRaffles active={value === '4'}  sx={value === '4' ? classes.showTab : classes.hideTab}/>
          <DashboardWidgetBotChecklist sx={value === '5' ? classes.showTab : classes.hideTab}/>
          <DashboardWidgetBotCustom sx={value === '6' ? classes.showTab : classes.hideTab}/>
        </Box>
      </TabContext>
    </Card>
  );
};
