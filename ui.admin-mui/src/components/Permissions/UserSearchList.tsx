import {
  Autocomplete,
  TextField,
} from '@mui/material';
import {
  useEffect, useMemo, useState,
} from 'react';
import { v4 } from 'uuid';

import { getSocket } from '~/src/helpers/socket';

let state = v4();

export const UserSearchlist: React.FC<{
  onChange: (users: string[]) => void,
  users: string[],
  label: string
}> = ({
  onChange, users, label,
}) => {
  const [ inputValue, setInputValue ] = useState('');
  const [ isSearching, setIsSearching ] = useState(false);

  const [ mapping, setMapping ] = useState<{ userId: string, userName: string}[]>([]);
  const [ options, setOptions ] = useState<{ userId: string, userName: string}[]>([]);

  useEffect(() => {
    users.forEach((userId) => {
      getSocket('/core/users').emit('getNameById', userId, (err, userName) => {
        if (err) {
          return console.error(err);
        }
        if (userName) {
          console.log(`Mapping ${userId} => ${userName}`);
          setMapping(i => ([...i, {
            userId, userName,
          }]));
        } else {
          setMapping(i => ([...i, {
            userId, userName: 'unknown user',
          }]));
        }
      });
    });
  }, [ users ]);

  useEffect(() => {
    if (inputValue.length === 0) {
      return;
    }

    state = v4();
    setIsSearching(true);
    getSocket('/core/users').emit('find.viewers', {
      filter: [{
        operation: 'contains', columnName: 'userName', value: inputValue,
      }],
      state,
      exactUsernameFromTwitch: true,
    }, (err, r, _count, state2) => {
      if (err) {
        return console.error(err);
      }
      if (state === state2) {
        r = r.filter(o => o.userName.length > 0);
        // expecting this data
        setOptions(r);
        setMapping(i => ([
          ...i, ...r,
        ]));
        setIsSearching(false);
      }
    });
  }, [ inputValue ]);

  const value = useMemo(() => {
    return users.map(userId => ({
      userId, userName: mapping.find(map => map.userId === userId)?.userName || 'unknown user',
    }));
  }, [ users, mapping ]);

  return  <Autocomplete
    selectOnFocus
    disableCloseOnSelect
    fullWidth
    handleHomeEndKeys
    getOptionLabel={(option) =>
      typeof option === 'string' ? option : `${option.userName} (${option.userId})`
    }
    filterOptions={(x) => {
      return x.filter(opt => !users.includes(opt.userId));
    }}
    options={options}
    multiple
    freeSolo
    inputValue={inputValue}
    loading={isSearching}
    value={value}
    filterSelectedOptions
    onChange={(_, newValue) => onChange(newValue.map(o => typeof o === 'string' ? o : o.userId))}
    onInputChange={(_, newInputValue) => {
      setInputValue(newInputValue);
    }}
    renderInput={(params) => (
      <TextField {...params} label={label} variant='filled' />
    )}
  />;
};