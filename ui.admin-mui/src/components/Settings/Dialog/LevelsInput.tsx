import { DeleteTwoTone } from '@mui/icons-material';
import {
  IconButton, ListItem, Stack, TextField,
} from '@mui/material';
import {
  IsInt, IsNotEmpty, Max, Min, MinLength, validateOrReject,
} from 'class-validator';
import { isEqual } from 'lodash';
import React from 'react';

import { useTranslation } from '~/src/hooks/useTranslation';
import { useValidator } from '~/src/hooks/useValidator';

export class Item {
  @IsNotEmpty()
  @MinLength(1)
    name: string;

  @IsNotEmpty()
  @Min(0, { message: '$constraint1' })
  @Max(100, { message: '$constraint1' })
  @IsInt()
    winPercentage: number;

  @IsNotEmpty()
  @Min(0, { message: '$constraint1' })
    payoutMultiplier: number;

  @IsNotEmpty()
  @Min(1, { message: '$constraint1' })
  @IsInt()
    maxUsers: number;
}

export const SettingsSystemsDialogLevelsInput: React.FC<{
  item: Item,
  onChange: (value: Item) => void,
  onLevelsError: (haveErrors: boolean) => void;
  onLevelDelete: () => void;
}> = ({
  item,
  onChange,
  onLevelsError,
  onLevelDelete,
}) => {
  const [ model, setModel ] = React.useState(item);
  const { propsError, setErrors, haveErrors } = useValidator({ mustBeDirty: false });
  const { translate } = useTranslation();

  React.useEffect(() => {
    onLevelsError(haveErrors);
  }, [haveErrors, onLevelsError]);

  const validate = React.useCallback(() => {
    const toCheck = new Item();
    toCheck.name = model.name;
    toCheck.winPercentage = model.winPercentage;
    toCheck.payoutMultiplier = model.payoutMultiplier;
    toCheck.maxUsers = model.maxUsers;

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