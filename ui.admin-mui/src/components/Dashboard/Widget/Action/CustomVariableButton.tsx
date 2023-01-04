import { CircularProgress } from '@mui/material';
import { Box } from '@mui/system';
import { Variable } from '@sogebot/backend/dest/database/entity/variable';
import { CustomVariableItem } from '@sogebot/backend/src/database/entity/dashboard';
import { getContrastColor } from '@sogebot/ui-helpers/colors';
import { useCallback, useState } from 'react';
import { useIntervalWhen } from 'rooks';

import { ColorButton } from '~/src/components/Dashboard/Widget/Action/_ColorButton';
import { DashboardWidgetActionCustomVariableUnknownButton } from '~/src/components/Dashboard/Widget/Action/CustomVariable/UnknownButton';
import { isHexColor } from '~/src/validators';

import { getSocket } from '../../../../helpers/socket';
import { DashboardWidgetActionCustomVariableEvalButton } from './CustomVariable/EvalButton';
import { DashboardWidgetActionCustomVariableNumberButton } from './CustomVariable/NumberButton';
import { DashboardWidgetActionCustomVariableOptionsButton } from './CustomVariable/OptionsButton';
import { DashboardWidgetActionCustomVariableTextButton } from './CustomVariable/TextButton';

export const DashboardWidgetActionCustomVariableButton: React.FC<{ item: CustomVariableItem }> = ({
  item,
}) => {
  const [ loading, setLoading ] = useState(true);
  const [ variable, setVariable ] = useState<Variable | null>(null);
  const [ unknownVariable, setUnknownVariable ] = useState<null | string>(null);

  const onUpdateHandle = useCallback((value: number | string) => {
    if (variable) {
      setVariable(Variable.merge(variable, { currentValue: String(value) }));
    }
  }, [ variable ]);

  useIntervalWhen(() => {
    getSocket('/core/customvariables').emit('customvariables::list', (err, items) => {
      if (err) {
        return console.error(err);
      }

      const foundItem = items.find(o => o.variableName === item.options.customvariable);
      if (!foundItem) {
        setLoading(false);
        setUnknownVariable(item.options.customvariable.length > 0 ? item.options.customvariable : 'Variable not set');
        return;
      }
      setLoading(false);
      setUnknownVariable(null);
      setVariable(foundItem);
    });
  }, 5000, true, true);

  return (<Box>
    {loading && <ColorButton htmlcolor={item.options.color} fullWidth><CircularProgress sx={{ color: getContrastColor(isHexColor(item.options.color) === true ? item.options.color : '#444444') }} size={28}/></ColorButton>}
    {!loading && unknownVariable && <DashboardWidgetActionCustomVariableUnknownButton variableName={unknownVariable} item={item}/>}
    {!loading && variable && variable.type === 'number' && <DashboardWidgetActionCustomVariableNumberButton item={item} variable={variable} onUpdate={onUpdateHandle}/>}
    {!loading && variable && variable.type === 'text' && <DashboardWidgetActionCustomVariableTextButton item={item} variable={variable} onUpdate={onUpdateHandle}/>}
    {!loading && variable && variable.type === 'options' && <DashboardWidgetActionCustomVariableOptionsButton item={item} variable={variable} onUpdate={onUpdateHandle}/>}
    {!loading && variable && variable.type === 'eval' && <DashboardWidgetActionCustomVariableEvalButton item={item} variable={variable}/>}
  </Box>);
};
