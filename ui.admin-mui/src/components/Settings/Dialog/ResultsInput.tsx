import { DeleteTwoTone } from '@mui/icons-material';
import { IconButton, ListItem, Stack, TextField } from '@mui/material';
import { isEqual } from 'lodash';
import React from 'react';
import { z } from 'zod';

import { useTranslation } from '../../../hooks/useTranslation';
import { useValidator } from '../../../hooks/useValidator';

const schema = z.object({
  message:    z.string().min(1),
  percentage: z.number().int().min(0).max(100),
});
export type Item = z.infer<typeof schema>;

export const SettingsSystemsDialogResultsInput: React.FC<{
  item:     Item,
  onChange: (value: Item) => void,
  onError:  (haveErrors: boolean) => void;
  onDelete: () => void;
}> = ({
  item,
  onChange,
  onError,
  onDelete,
}) => {
  const [ model, setModel ] = React.useState(item);
  const { propsError, validate, haveErrors } = useValidator({ mustBeDirty: false, schema });
  const { translate } = useTranslation();

  React.useEffect(() => {
    onError(haveErrors);
  }, [haveErrors, onError]);

  React.useEffect(() => {
    validate({ message: model.message, percentage: model.percentage }, true);
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
        {...propsError('message', { helperText: ' ' })}
        label={translate('games.heist.message')}
        value={item.message}
        fullWidth
        onChange={(event) => handleChange('message', event.currentTarget.value)}/>
      <TextField
        {...propsError('percentage', { helperText: ' ' })}
        type="number"
        label={translate('games.heist.percentage')}
        value={item.percentage}
        onChange={(event) => handleChange('percentage', Number(event.currentTarget.value))}/>
      <IconButton onClick={onDelete} sx={{ height: 'fit-content' }}color='error'><DeleteTwoTone/></IconButton>
    </Stack>
  </ListItem>;
};