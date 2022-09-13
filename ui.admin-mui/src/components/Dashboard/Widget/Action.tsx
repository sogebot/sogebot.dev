import { TabContext, TabList } from '@mui/lab';
import {
  Box, Card, Stack, Tab,
} from '@mui/material';
import { QuickActions } from '@sogebot/backend/src/database/entity/dashboard';
import orderBy from 'lodash/orderBy';
import * as React from 'react';
import { useSelector } from 'react-redux';

import { DashboardWidgetActionUnknownButton } from '~/src/components/Dashboard/Widget/Action/Buttons/UnknownButton';
import { DashboardWidgetActionCommandButton } from '~/src/components/Dashboard/Widget/Action/CommandButton';
import { DashboardWidgetActionCountdownButton } from '~/src/components/Dashboard/Widget/Action/CountdownButton';
import { DashboardWidgetActionCustomVariableButton } from '~/src/components/Dashboard/Widget/Action/CustomVariableButton';
import { DashboardWidgetBotDialogActionsEdit } from '~/src/components/Dashboard/Widget/Action/Dialog/ActionsEdit';
import { DashboardWidgetActionMarathonButton } from '~/src/components/Dashboard/Widget/Action/MarathonButton';
import { DashboardWidgetActionStopwatchButton } from '~/src/components/Dashboard/Widget/Action/StopwatchButton';
import { getSocket } from '~/src/helpers/socket';
import theme from '~/src/theme';

import { DashboardWidgetActionRandomizerButton } from './Action/RandomizerButton';

export const DashboardWidgetAction: React.FC = () => {
  const [value, setValue] = React.useState('1');
  const [height, setHeight] = React.useState(0);
  const ref = React.createRef<HTMLDivElement>();
  const { user } = useSelector((state: any) => state.user);
  const [ actions, setActions ] = React.useState<QuickActions.Item[]>([]);
  const [ timestamp, setTimestamp ] = React.useState(Date.now());

  React.useEffect(() => {
    if (ref.current) {
      const bodyRect = document.body.getBoundingClientRect();
      const elemRect = ref.current.getBoundingClientRect();
      const offset   = elemRect.top - bodyRect.top;
      setHeight(window.innerHeight - offset - 3);
    }
  }, [ref]);

  React.useEffect(() => {
    getSocket('/widgets/quickaction').emit('generic::getAll', user.id, (err, items) => {
      if (err) {
        return console.error(err);
      }
      setActions(orderBy(items, 'order', 'asc'));
    });
  }, [user, timestamp]);

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
  };

  return (
    <Card variant="outlined" sx={{ height: height + 'px' }} ref={ref}>
      <TabContext value={value}>
        <Box sx={{
          borderBottom: 1, borderColor: 'divider', backgroundColor: theme.palette.grey[900],
        }}>
          <Stack direction="row" alignItems={'center'}>
            <Box width={'100%'} height={48}>
              <TabList onChange={handleChange}>
                <Tab label="Actions" value="1" />
              </TabList>
            </Box>
            <DashboardWidgetBotDialogActionsEdit onClose={React.useCallback(() => setTimestamp(Date.now()), [])}/>
          </Stack>
        </Box>
        <Box sx={{
          position: 'relative', height: 'calc(100% - 48px);', 
        }}>
          {actions.map(action => {
            if (action.type === 'command') {
              return <DashboardWidgetActionCommandButton key={action.id} item={action}/>;
            }
            if (action.type === 'customvariable') {
              return <DashboardWidgetActionCustomVariableButton key={action.id} item={action}/>;
            }
            if (action.type === 'randomizer') {
              return <DashboardWidgetActionRandomizerButton key={action.id} item={action}/>;
            }
            if (action.type === 'overlayCountdown') {
              return <DashboardWidgetActionCountdownButton key={action.id} item={action}/>;
            }
            if (action.type === 'overlayMarathon') {
              return <DashboardWidgetActionMarathonButton key={action.id} item={action}/>;
            }
            if (action.type === 'overlayStopwatch') {
              return <DashboardWidgetActionStopwatchButton key={action.id} item={action}/>;
            }
            return <DashboardWidgetActionUnknownButton item={action} key='unknown button' variableName='Unknown button type'/>;
          })}
        </Box>
      </TabContext>
    </Card>
  );
};
