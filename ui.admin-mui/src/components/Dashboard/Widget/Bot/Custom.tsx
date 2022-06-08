import { TabContext, TabList } from '@mui/lab';
import {
  Alert, Box, Stack, Tab,
} from '@mui/material';
import { WidgetCustomInterface } from '@sogebot/backend/src/database/entity/widget';
import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { getSocket } from '~/src/helpers/socket';
import { useStyles } from '~/src/hooks/useStyles';
import theme from '~/src/theme';

import { DashboardWidgetBotDialogCustomURLsEdit } from './Dialog/CustomURLsEdit';

export const DashboardWidgetBotCustom: React.FC<{ className: string }> = ({
  className,
}) => {
  const [ custom, setCustom ] = React.useState<WidgetCustomInterface[]>([]);
  const { user } = useSelector((state: any) => state.user);
  const [ tab, setTab ] = React.useState('1');
  const [ refreshTimestamp, setRefreshTimestamp ] = React.useState(Date.now());
  const styles = useStyles();

  useEffect(() => {
    getSocket('/widgets/custom').emit('generic::getAll', user.id, (err, items) => {
      if (err) {
        return console.error(err);
      }
      setCustom(items);
    });
    setTab('1');
  }, [user, refreshTimestamp]);

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setTab(newValue);
  };

  return (
    <Box className={className}>
      <TabContext value={tab}>
        <Box sx={{
          borderBottom: 1, borderColor: 'divider', backgroundColor: theme.palette.grey[900],
        }}>
          <Stack direction="row" alignItems={'center'}>
            <Box width={'100%'} height={48}>
              {custom.length > 0 && <TabList onChange={handleChange} variant='scrollable' scrollButtons="auto">
                {custom.map((item, idx) => <Tab key={item.id} label={item.name} value={String(idx+1)} />)}
              </TabList>}
            </Box>
            <DashboardWidgetBotDialogCustomURLsEdit setRefreshTimestamp={setRefreshTimestamp}/>
          </Stack>
        </Box>
        <Box sx={{ position: 'relative', height: 'calc(100% - 48px);' }}>
          {custom.map((item, idx) => <iframe className={tab === String(idx+1) ? styles.showTab : styles.hideTab} frameBorder="0" key={item.id} src={item.url} width="100%" height="100%"/>)}

          {custom.length === 0 && <Alert severity="info">No URLs are defined yet.</Alert>}
        </Box>
      </TabContext>
    </Box>
  );
};