import { DeleteTwoTone } from '@mui/icons-material';
import { IconButton, ListItem, Stack, TextField } from '@mui/material';
import { isEqual } from 'lodash';
import React from 'react';
import { z } from 'zod';

import { useTranslation } from '../../../hooks/useTranslation';
import { useValidator } from '../../../hooks/useValidator';

const schema = z.object({
  name:             z.string().min(1),
  winPercentage:    z.number().int().min(0).max(100),
  payoutMultiplier: z.number().min(0),
  maxUsers:         z.number().int().min(1),
});
export type Item = z.infer<typeof schema>;

export const SettingsSystemsDialogLevelsInput: React.FC<{
  item:          Item,
  onChange:      (value: Item) => void,
  onLevelsError: (haveErrors: boolean) => void;
  onLevelDelete: () => void;
}> = ({
  item,
  onChange,
  onLevelsError,
  onLevelDelete,
}) => {
  const [ model, setModel ] = React.useState(item);
  const { propsError, validate, haveErrors } = useValidator({ schema, mustBeDirty: false });
  const { translate } = useTranslation();

  React.useEffect(() => {
    onLevelsError(haveErrors);
  }, [haveErrors, onLevelsError]);

  React.useEffect(() => {
    validate({ name: model.name, winPercentage: model.winPercentage, payoutMultiplier: model.payoutMultiplier, maxUsers: model.maxUsers }, true);
  }, [model]);

  React.useEffect(() => {
    if (!isEqual(item, model)) {
      // update on model change
      onChange(model);
    }
  }, [model, onChange, item]);

  const handleChange = <K extends keyof Item>(type: K, value: Item[K]) => {
    setModel(i => {
      i[type] = value;
      return { ...i };
    });
  };

  return <ListItem>
    <Stack direction='row' width='100%' alignItems={'center'}>
      <TextField
        {...propsError('name', { helperText: ' ' })}
        label={translate('games.heist.name')}
        value={item.name}
        fullWidth
        onChange={(event) => handleChange('name', event.currentTarget.value)}/>
      <TextField
        {...propsError('winPercentage', { helperText: ' ' })}
        type="number"
        label={translate('games.heist.winPercentage')}
        value={item.winPercentage}
        onChange={(event) => handleChange('winPercentage', Number(event.currentTarget.value))}/>
      <TextField
        {...propsError('payoutMultiplier', { helperText: ' ' })}
        type="number"
        label={translate('games.heist.payoutMultiplier')}
        value={item.payoutMultiplier}
        onChange={(event) => handleChange('payoutMultiplier', Number(event.currentTarget.value))}/>
      <TextField
        {...propsError('maxUsers', { helperText: ' ' })}
        type="number"
        label={translate('games.heist.maxUsers')}
        value={item.maxUsers}
        onChange={(event) => handleChange('maxUsers', Number(event.currentTarget.value))}/>
      <IconButton onClick={onLevelDelete} sx={{ height: 'fit-content' }}color='error'><DeleteTwoTone/></IconButton>
    </Stack>
  </ListItem>;
};