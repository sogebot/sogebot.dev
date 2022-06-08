import { TabContext, TabList } from '@mui/lab';
import {
  Box, Card, Tab,
} from '@mui/material';
import * as React from 'react';
import { useSelector } from 'react-redux';

import translate from '~/src/helpers/translate';
import { useStyles } from '~/src/hooks/useStyles';
import theme from '~/src/theme';

import { DashboardWidgetBotChecklist } from './Bot/Checklist';
import { DashboardWidgetBotCustom } from './Bot/Custom';
import { DashboardWidgetBotEvents } from './Bot/Events';
import { DashboardWidgetBotQueue } from './Bot/Queue';
import { DashboardWidgetBotRaffles } from './Bot/Raffles';
import { DashboardWidgetBotSocial } from './Bot/Social';
import { DashboardWidgetBotYTPlayer } from './Bot/YTPlayer';

export const DashboardWidgetBot: React.FC = () => {
  const { systems } = useSelector((state: any) => state.loader);
  const styles = useStyles();

  const [value, setValue] = React.useState('1');

  const [height, setHeight] = React.useState(0);
  const ref = React.createRef<HTMLDivElement>();

  React.useEffect(() => {
    if (ref.current) {
      const bodyRect = document.body.getBoundingClientRect();
      const elemRect = ref.current.getBoundingClientRect();
      const offset   = elemRect.top - bodyRect.top;
      setHeight(window.innerHeight - offset - 3);
    }
  }, [ref]);

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
        <Box sx={{ position: 'relative', height: 'calc(100% - 48px);' }}>
          <DashboardWidgetBotEvents className={value === '1' ? styles.showTab : styles.hideTab}/>
          <DashboardWidgetBotYTPlayer className={value === '2' ? styles.showTab : styles.hideTab}/>
          <DashboardWidgetBotQueue className={value === '3' ? styles.showTab : styles.hideTab}/>
          <DashboardWidgetBotRaffles className={value === '4' ? styles.showTab : styles.hideTab}/>
          <DashboardWidgetBotSocial className={value === '5' ? styles.showTab : styles.hideTab}/>
          <DashboardWidgetBotChecklist className={value === '6' ? styles.showTab : styles.hideTab}/>
          <DashboardWidgetBotCustom className={value === '7' ? styles.showTab : styles.hideTab}/>
        </Box>
      </TabContext>
    </Card>
  );
};
