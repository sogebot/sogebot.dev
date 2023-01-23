import { DeleteTwoTone } from '@mui/icons-material';
import {
  IconButton, ListItem, Stack, TextField,
} from '@mui/material';
import {
  IsInt, IsNotEmpty, Max, Min, MinLength, validateOrReject,
} from 'class-validator';
import { isEqual } from 'lodash';
import React from 'react';

import { useTranslation } from '../../../hooks/useTranslation';
import { useValidator } from '../../../hooks/useValidator';

export class Item {
  @IsNotEmpty()
  @MinLength(1)
    message: string;

  @IsNotEmpty()
  @Min(0, { message: '$constraint1' })
  @Max(100, { message: '$constraint1' })
  @IsInt()
    percentage: number;
}

export const SettingsSystemsDialogResultsInput: React.FC<{
  item: Item,
  onChange: (value: Item) => void,
  onError: (haveErrors: boolean) => void;
  onDelete: () => void;
}> = ({
  item,
  onChange,
  onError,
  onDelete,
}) => {
  const [ model, setModel ] = React.useState(item);
  const { propsError, setErrors, haveErrors } = useValidator({ mustBeDirty: false });
  const { translate } = useTranslation();

  React.useEffect(() => {
    onError(haveErrors);
  }, [haveErrors, onError]);

  const validate = React.useCallback(() => {
    const toCheck = new Item();
    toCheck.message = model.message;
    toCheck.percentage = model.percentage;

    validateOrReject(toCheck, { always: true })
      .then(() => setErrors(null))
      .catch((e) => {
        console.log({ e });
        setErrors(e);
      });
  }, [ model, setErrors ]);

  React.useEffect(() => {
    validate();
  }, [model, validate]);

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