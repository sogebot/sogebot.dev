import {
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
} from '@mui/material';
import { Eventlist } from '@sogebot/backend/dest/database/entity/overlay';
import React from 'react';

import { useTranslation } from '../../../hooks/useTranslation';

type Props = {
  model: Eventlist;
  onUpdate: (value: Eventlist) => void;
};

export const EventlistSettings: React.FC<Props> = ({ model, onUpdate }) => {
  const { translate } = useTranslation();

  return <>
    <Divider/>

    <Stack spacing={0.5}>
      <FormControl fullWidth variant="filled" >
        <InputLabel id="type-select-label">Order</InputLabel>
        <Select
          MenuProps={{ PaperProps: { sx: { maxHeight: 200 } } }}
          label={translate('overlays.emotes.settings.cEmotesAnimation')}
          labelId="type-select-label"
          value={model.order}
          onChange={(ev) => onUpdate({
            ...model, order: ev.target.value as 'asc',
          })}
        >
          <MenuItem value="asc" key="asc">asc</MenuItem>
          <MenuItem value="desc" key="desc">desc</MenuItem>
        </Select>
      </FormControl>
    </Stack>
  </>;
};