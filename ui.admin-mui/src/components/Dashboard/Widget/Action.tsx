import { UnfoldLessTwoTone, UnfoldMoreTwoTone } from '@mui/icons-material';
import { TabContext, TabList } from '@mui/lab';
import {
  Box, Card, IconButton, Tab, Typography,
} from '@mui/material';
import { QuickActions } from '@sogebot/backend/src/database/entity/dashboard';
import orderBy from 'lodash/orderBy';
import React from 'react';
import { useIntervalWhen, useLocalstorageState } from 'rooks';

import { DashboardWidgetActionUnknownButton } from './Action/Buttons/UnknownButton';
import { DashboardWidgetActionCommandButton } from './Action/CommandButton';
import { DashboardWidgetActionCountdownButton } from './Action/CountdownButton';
import { DashboardWidgetActionCustomVariableButton } from './Action/CustomVariableButton';
import { DashboardWidgetBotDialogActionsEdit } from './Action/Dialog/ActionsEdit';
import { DashboardWidgetActionMarathonButton } from './Action/MarathonButton';
import { DashboardWidgetActionRandomizerButton } from './Action/RandomizerButton';
import { DashboardWidgetActionStopwatchButton } from './Action/StopwatchButton';
import { getSocket } from '../../../helpers/socket';
import { useAppSelector } from '../../../hooks/useAppDispatch';
import theme from '../../../theme';

export const DashboardWidgetAction: React.FC = () => {
  const [value, setValue] = React.useState('1');
  const [height, setHeight] = React.useState(0);
  const ref = React.createRef<HTMLDivElement>();
  const { user } = useAppSelector(state => state.user);
  const [ actions, setActions ] = React.useState<QuickActions.Item[]>([]);
  const [ timestamp, setTimestamp ] = React.useState(Date.now());

  const [ unfold, setUnfold ] = useLocalstorageState('action_unfold', true);

  useIntervalWhen(() => {
    if (ref.current) {
      const bodyRect = document.body.getBoundingClientRect();
      const elemRect = ref.current.getBoundingClientRect();
      const offset   = elemRect.top - bodyRect.top;
      setHeight(window.innerHeight - offset - 3);
    }
  }, 1000, true, true);

  React.useEffect(() => {
    if (!user) {
      return;
    }
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
          borderBottom:    1,
          borderColor:     'divider',
          backgroundColor: theme.palette.grey[900],
          height:          '48px',
        }}>
          <Box height={48} sx={{
            display: unfold ? 'flex' : 'none', alignItems: 'center',
          }}>
            <TabList onChange={handleChange} sx={{ flexGrow: 1 }}>
              <Tab label="Actions" value="1" />
            </TabList>
            <DashboardWidgetBotDialogActionsEdit onClose={React.useCallback(() => setTimestamp(Date.now()), [])}/>
            <IconButton onClick={() => setUnfold(false)} sx={{ height: '40px' }}>
              <UnfoldLessTwoTone/>
            </IconButton>
          </Box>
          <IconButton onClick={() => setUnfold(true)} sx={{
            display: !unfold ? undefined : 'none', mt: 0.5, height: '40px',
          }}>
            <UnfoldMoreTwoTone/>
          </IconButton>
        </Box>
        <Box sx={{
          position:        'relative',
          height:          'calc(100% - 48px);',
          display:         !unfold ? undefined : 'none',
          textOrientation: 'mixed',
          writingMode:     'vertical-rl',
          margin:          '7px',
        }}>
          <Typography variant='button' sx={{ p: 1 }}>
          Actions
          </Typography>
        </Box>
        <Box sx={{
          position: 'relative', height: 'calc(100% - 48px);', display: unfold ? undefined : 'none',
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
