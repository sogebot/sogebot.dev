import { OBSWebsocket } from '@entity/obswebsocket';
import { RefreshTwoTone } from '@mui/icons-material';
import { CircularProgress, FormControl, FormHelperText, IconButton, InputAdornment, InputLabel, MenuItem, Select, Typography } from '@mui/material';
import axios from 'axios';
import capitalize from 'lodash/capitalize';
import orderBy from 'lodash/orderBy';
import React from 'react';

import getAccessToken from '../../../getAccessToken';
import { useTranslation } from '../../../hooks/useTranslation';
import { useValidator } from '../../../hooks/useValidator';

export const FormOBSWebsocketSelect: React.FC<{
  value?:    string | null
  onChange?: (value: { id: string, name: string }) => void,
  error?:    ReturnType<ReturnType<typeof useValidator>['propsError']>
}> = ({
  value,
  onChange,
  error,
}) => {
  const { translate } = useTranslation();

  const [ propsValue, setPropsValue ] = React.useState(value || null);

  const [ progress, setProgress ] = React.useState(false);
  const [ items, setItems ] = React.useState<OBSWebsocket[]>([]);

  const selectedItem = React.useMemo(() => {
    return items.find(o => o.id === propsValue);
  }, [ items, propsValue ]);

  const handleChange = React.useCallback((event: any) => {
    setPropsValue(event.target.value);
  }, []);

  const refreshItems = () => {
    setProgress(true);
    return new Promise<void>((resolve) => {
      axios.get('/api/integrations/obswebsocket', {
        headers: {
          Authorization: `Bearer ${getAccessToken()}`
        }
      }).then(({ data }) => {
        setItems(orderBy(data.data, 'name', 'asc'));
        setProgress(false);
        resolve();
      });
    });
  };

  React.useEffect(() => {
    if (onChange && selectedItem) {
      error?.onInput && error.onInput();
      onChange(selectedItem);
    }
  }, [ selectedItem, onChange ]);

  React.useEffect(() => {
    refreshItems();
  }, [ ]);

  return (<>
    <FormControl fullWidth error={error?.error}>
      <InputLabel id="reward-label" shrink>{translate(`events.definitions.taskId.label`)}</InputLabel>
      <Select
        MenuProps={{ PaperProps: { sx: { maxHeight: 300 } } }}
        value={propsValue ?? ''}
        displayEmpty
        renderValue={(selected) => {
          if (selected === '') {
            return <em>-- Please OBS Websocket item --</em>;
          }

          if (progress) {
            return <Typography variant='body2'>Loading...</Typography>;
          }

          if (selectedItem) {
            return <Typography variant='body2'>
              <Typography component='span' sx={{
                px: 0.5, fontWeight: 'bold',
              }}>{selectedItem.name}</Typography>
              <small>{selectedItem.id}</small>
            </Typography>;
          } else {
            return <Typography variant='body2'>
              Unknown OBSWebsocket item selected and probably doesn't exist anymore
            </Typography>;
          }
        }}
        labelId="reward-label"
        id="demo-simple-select"
        label={capitalize(translate(`events.definitions.taskId.label`))}
        onChange={handleChange}
        endAdornment={<InputAdornment position="end" sx={{ pr: 3 }}>
          <IconButton disabled={progress} onClick={refreshItems}>
            { progress
              ? <CircularProgress size={24}/>
              : <RefreshTwoTone/>
            }
          </IconButton>
        </InputAdornment>}
      >
        <MenuItem disabled value="">
          <em>-- Please select a OBS Websocket item --</em>
        </MenuItem>
        {items.map(it => <MenuItem value={it.id}>
          <Typography variant='body2'>
            <Typography component='span' sx={{
              px: 0.5, fontWeight: 'bold',
            }}>{it.name}</Typography>
            <small>{it.id}</small>
          </Typography>
        </MenuItem>)}
      </Select>
      {error?.helperText && <FormHelperText error>{error.helperText}</FormHelperText>}
    </FormControl>
  </>
  );
};