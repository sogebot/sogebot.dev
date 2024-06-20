import { TabContext, TabList } from '@mui/lab';
import { Alert, Box, Stack, SxProps, Tab } from '@mui/material';
import { WidgetCustomInterface } from '@sogebot/backend/src/database/entity/widget';
import axios from 'axios';
import { useAtomValue } from 'jotai';
import React, { useEffect } from 'react';

import { DashboardWidgetBotDialogCustomURLsEdit } from './Dialog/CustomURLsEdit';
import { loggedUserAtom } from '../../../../atoms';
import getAccessToken from '../../../../getAccessToken';
import theme from '../../../../theme';
import { classes } from '../../../styles';

export const DashboardWidgetBotCustom: React.FC<{ sx: SxProps }> = ({
  sx,
}) => {
  const [ custom, setCustom ] = React.useState<WidgetCustomInterface[]>([]);
  const user = useAtomValue(loggedUserAtom);
  const [ tab, setTab ] = React.useState('1');
  const [ refreshTimestamp, setRefreshTimestamp ] = React.useState(Date.now());

  useEffect(() => {
    if (!user) {
      return;
    }
    axios.get('/api/widgets/custom', { headers: { authorization: `Bearer ${getAccessToken()}` } }).then(({ data }) => {
      setCustom(data.data);
    });
    setTab('1');
  }, [user, refreshTimestamp]);

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setTab(newValue);
  };

  return (
    <Box sx={sx}>
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
        <Box sx={{
          position: 'relative', height: 'calc(100% - 48px);',
        }}>
          {custom.map((item, idx) => <Box sx={{
            ...(tab === String(idx+1) ? classes.showTab : classes.hideTab), height: '100%', width: '100%',
          }} key={item.id} >
            <iframe frameBorder="0" src={item.url} width="100%" height="100%"/>
          </Box>)}

          {custom.length === 0 && <Alert severity="info">No URLs are defined yet.</Alert>}
        </Box>
      </TabContext>
    </Box>
  );
};