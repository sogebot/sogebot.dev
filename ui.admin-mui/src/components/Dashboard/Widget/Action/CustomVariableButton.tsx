import { CircularProgress } from '@mui/material';
import { Box } from '@mui/system';
import { Variable } from '@sogebot/backend/dest/database/entity/variable';
import { CustomVariableItem } from '@sogebot/backend/src/database/entity/dashboard';
import axios from 'axios';
import React, { useCallback, useState } from 'react';
import { useIntervalWhen } from 'rooks';

import { ColorButton } from './_ColorButton';
import { DashboardWidgetActionCustomVariableEvalButton } from './CustomVariable/EvalButton';
import { DashboardWidgetActionCustomVariableNumberButton } from './CustomVariable/NumberButton';
import { DashboardWidgetActionCustomVariableOptionsButton } from './CustomVariable/OptionsButton';
import { DashboardWidgetActionCustomVariableTextButton } from './CustomVariable/TextButton';
import { DashboardWidgetActionCustomVariableUnknownButton } from './CustomVariable/UnknownButton';
import { getContrastColor } from '../../../../colors';
import { useScope } from '../../../../hooks/useScope';
import { isHexColor } from '../../../../validators';

export const DashboardWidgetActionCustomVariableButton: React.FC<{ item: CustomVariableItem }> = ({
  item,
}) => {
  const scope = useScope('customvariables');
  const [ loading, setLoading ] = useState(true);
  const [ variable, setVariable ] = useState<Variable | null>(null);
  const [ unknownVariable, setUnknownVariable ] = useState<null | string>(null);

  const onUpdateHandle = useCallback((value: number | string) => {
    if (variable) {
      setVariable(v => ({
        ...v, currentValue: String(value),
      }) as Variable);
    }
  }, [ variable ]);

  useIntervalWhen(() => {
    axios.get('/api/core/customvariables').then(({ data }) => {
      const foundItem = data.data.find((o: any) => o.variableName === item.options.customvariable);
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
    {!loading && variable && variable.type === 'number' && <DashboardWidgetActionCustomVariableNumberButton disabled={!scope.manage} item={item} variable={variable} onUpdate={onUpdateHandle}/>}
    {!loading && variable && variable.type === 'text' && <DashboardWidgetActionCustomVariableTextButton disabled={!scope.manage} item={item} variable={variable} onUpdate={onUpdateHandle}/>}
    {!loading && variable && variable.type === 'options' && <DashboardWidgetActionCustomVariableOptionsButton disabled={!scope.manage} item={item} variable={variable} onUpdate={onUpdateHandle}/>}
    {!loading && variable && variable.type === 'eval' && <DashboardWidgetActionCustomVariableEvalButton item={item} variable={variable}/>}
  </Box>);
};
