import { DeleteTwoTone } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Box,
  Button,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import InputAdornment from '@mui/material/InputAdornment';
import { useRouter } from 'next/router';
import { useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useRefElement } from 'rooks';

import { useSettings } from '~/src/hooks/useSettings';

const PageSettingsModulesSystemsChecklist: React.FC<{
  onVisible: () => void,
}> = ({
  onVisible,
}) => {
  const router = useRouter();
  const { settings, loading, refresh, save, saving, handleChange } = useSettings('/systems/checklist');

  useEffect(() => {
    refresh();
  }, [ router, refresh ]);

  const [ref, element]  = useRefElement<HTMLElement>();
  const scrollY = useSelector<number, number>((state: any) => state.page.scrollY);
  useEffect(() => {
    if (element) {
      if (element.offsetTop < scrollY + 100 && element.offsetTop + element.clientHeight > scrollY - 100) {
        onVisible();
      }
    }
  }, [element, scrollY, onVisible]);

  const handleItemUpdate = useCallback((idx: number, value: string) => {
    const update = { ...settings };
    update.customization.itemsArray[0][idx] = value;
    handleChange('customization.itemsArray', update.customization.itemsArray[0]);
  }, [ settings, handleChange ]);

  const handleItemAdd = useCallback(() => {
    const update = { ...settings };
    update.customization.itemsArray[0].push('');
    handleChange('customization.itemsArray', update.customization.itemsArray[0]);
  }, [ settings, handleChange ]);

  const handleItemDelete = useCallback((idx: number) => {
    const update = { ...settings };
    update.customization.itemsArray[0].splice(idx, 1);
    handleChange('customization.itemsArray', update.customization.itemsArray[0]);
  }, [ settings, handleChange ]);

  return (loading ? null : <Box ref={ref} id="checklist">
    <Typography variant='h2' sx={{ pb: 2 }}>Checklist</Typography>
    {settings && <Paper elevation={1} sx={{ p: 1 }}>
      <Stack spacing={1}>
        {settings.customization.itemsArray[0].map((item: string, idx: number) => <TextField
          key={idx}
          fullWidth
          label={'Item ' + (idx + 1)}
          variant="filled"
          value={item}
          InputProps={{
            endAdornment: <InputAdornment position="end">
              <IconButton sx={{ height: 'fit-content' }} color='error' onClick={() => handleItemDelete(idx)}><DeleteTwoTone/></IconButton>
            </InputAdornment>,
          }}
          onChange={(event) => handleItemUpdate(idx, event.target.value)}
        />)}
      </Stack>
      <Button onClick={() => handleItemAdd()}>Add new item</Button>
    </Paper>}

    <Stack direction='row' justifyContent='center' sx={{ pt: 2 }}>
      <LoadingButton sx={{ width: 300 }} variant='contained' loading={saving} onClick={save}>Save changes</LoadingButton>
    </Stack>
  </Box>
  );
};

export default PageSettingsModulesSystemsChecklist;
