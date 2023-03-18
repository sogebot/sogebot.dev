import { TabContext, TabList } from '@mui/lab';
import {
  Box, Card, Tab,
} from '@mui/material';
import React from 'react';
import { useSelector } from 'react-redux';
import { useIntervalWhen } from 'rooks';

import { DashboardWidgetBotChecklist } from './Bot/Checklist';
import { DashboardWidgetBotCustom } from './Bot/Custom';
import { DashboardWidgetBotEvents } from './Bot/Events';
import { DashboardWidgetBotQueue } from './Bot/Queue';
import { DashboardWidgetBotRaffles } from './Bot/Raffles';
import { DashboardWidgetBotSocial } from './Bot/Social';
import { DashboardWidgetBotYTPlayer } from './Bot/YTPlayer';
import { useTranslation } from '../../../hooks/useTranslation';
import theme from '../../../theme';
import { classes } from '../../styles';

export const DashboardWidgetBot: React.FC = () => {
  const { systems } = useSelector((state: any) => state.loader);
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

  return (
    <Card variant="outlined" sx={{ height: height + 'px' }} ref={ref}>
      <TabContext value={value}>
        <Box sx={{
          borderBottom: 1, borderColor: 'divider', backgroundColor: theme.palette.grey[900],
        }}>
          <TabList onChange={handleChange} variant='scrollable' scrollButtons="auto">
            <Tab label={translate('widget-title-eventlist')} value="1" />
            {(systems || []).find((o: any) => o.name === 'songs').enabled && <Tab label={translate('widget-title-ytplayer')} value="2" />}
            <Tab label={translate('widget-title-queue')} value="3" />
            <Tab label={translate('widget-title-raffles')} value="4" />
            <Tab label={translate('widget-title-social')} value="5" />
            <Tab label={translate('menu.checklist')} value="6" />
            <Tab label={translate('widget-title-custom')} value="7" />
          </TabList>
        </Box>
        <Box sx={{
          position: 'relative', height: 'calc(100% - 48px);',
        }}>
          <DashboardWidgetBotEvents sx={value === '1' ? classes.showTab : classes.hideTab}/>
          <DashboardWidgetBotYTPlayer sx={value === '2' ? classes.showTab : classes.hideTab}/>
          <DashboardWidgetBotQueue sx={value === '3' ? classes.showTab : classes.hideTab}/>
          <DashboardWidgetBotRaffles sx={value === '4' ? classes.showTab : classes.hideTab}/>
          <DashboardWidgetBotSocial sx={value === '5' ? classes.showTab : classes.hideTab}/>
          <DashboardWidgetBotChecklist sx={value === '6' ? classes.showTab : classes.hideTab}/>
          <DashboardWidgetBotCustom sx={value === '7' ? classes.showTab : classes.hideTab}/>
        </Box>
      </TabContext>
    </Card>
  );
};
