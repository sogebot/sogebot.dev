import { Autocomplete, TextField } from '@mui/material';
import axios from 'axios';
import React, { useEffect, useMemo, useState } from 'react';
import { v4 } from 'uuid';

import getAccessToken from '../../getAccessToken';

let state = v4();

export const UserSearchlist: React.FC<{
  onChange: (users: string[]) => void,
  users:    string[],
  label:    string,
  disabled?: boolean,
}> = ({
  onChange, users, label, disabled
}) => {
  const [ inputValue, setInputValue ] = useState('');
  const [ isSearching, setIsSearching ] = useState(false);

  const [ mapping, setMapping ] = useState<{ userId: string, userName: string }[]>([]);
  const [ options, setOptions ] = useState<{ userId: string, userName: string }[]>([]);

  useEffect(() => {
    users.forEach((userId) => {
      axios.post('/api/core/users/' + userId + '?_action=getNameById', { headers: { 'Authorization': 'Bearer ' + getAccessToken() } })
        .then(({ data }) => {
          if (data.data) {
            console.log(`Mapping ${userId} => ${data.data}`);
            setMapping(i => ([...i, {
              userId, userName: data.data,
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
    axios.get(`/api/core/users?state=${state}&exactUsernameFromTwitch=true&filter=${JSON.stringify([{
      operation: 'contains', columnName: 'userName', value: inputValue,
    }])}`, {
      headers: {
        Authorization: `Bearer ${getAccessToken()}`
      }
    }).then(({ data }) => {
      if (state === data.data.state) {
        const viewers = data.data.viewers.filter((o: any) => o.userName.length > 0);
        // expecting this data
        setOptions(viewers);
        setMapping(i => ([
          ...i, ...viewers,
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
    disabled={disabled}
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