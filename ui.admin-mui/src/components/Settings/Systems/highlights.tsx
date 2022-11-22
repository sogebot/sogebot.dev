import { DeleteTwoTone } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Backdrop,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  FormGroup,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/router';
import { useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useRefElement } from 'rooks';
import shortid from 'shortid';

import { useSettings } from '~/src/hooks/useSettings';
import { useTranslation } from '~/src/hooks/useTranslation';

const PageSettingsModulesSystemsHighlights: React.FC<{
  onVisible: () => void,
}> = ({
  onVisible,
}) => {

  const router = useRouter();
  const { translate } = useTranslation();

  const { settings, loading, refresh, save, saving, handleChange } = useSettings('/systems/highlights' as any);

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

  const handleItemAdd = useCallback(() => {
    const update = { ...settings };
    update.urls.urls[0].push({
      url:       window.origin + '/highlights/' + shortid.generate(),
      clip:      false,
      highlight: false,
    });
    handleChange('urls.urls', update.urls.urls[0]);
  }, [ settings, handleChange ]);

  const handleItemDelete = useCallback((idx: number) => {
    const update = { ...settings };
    update.urls.urls[0].splice(idx, 1);
    handleChange('urls.urls', update.urls.urls[0]);
  }, [ settings, handleChange ]);

  const handleItemUpdate = useCallback((idx: number, type: 'clip' | 'highlight', value: boolean) => {
    const update = { ...settings };
    update.urls.urls[0][idx][type] = value;
    handleChange('urls.urls', update.urls.urls[0]);
  }, [ settings, handleChange ]);

  return (<Box ref={ref} id="highlights">
    <Typography variant='h2' sx={{ pb: 2 }}>{ translate('menu.highlights') }</Typography>
    {settings && <Paper elevation={1} sx={{ p: 1 }}>
      <Stack spacing={1}>
        {settings.urls.urls[0].map((item: { url: string, clip: boolean, highlight: boolean }, idx: number) => <Stack spacing={1} direction='row' alignItems={'baseline'} key={idx}>
          <TextField
            disabled
            label={`URL #${idx + 1}`}
            fullWidth
            variant="filled"
            value={item.url}
          />
          <FormGroup>
            <FormControlLabel control={<Checkbox checked={item.clip} onChange={(_, checked) => handleItemUpdate(idx, 'clip', checked)} />} label='CLIP' />
          </FormGroup>
          <FormGroup>
            <FormControlLabel control={<Checkbox checked={item.highlight} onChange={(_, checked) => handleItemUpdate(idx, 'highlight', checked)} />} label='HIGHLIGHT' />
          </FormGroup>
          <IconButton sx={{ height: 'fit-content' }} color='error' onClick={() => handleItemDelete(idx)}><DeleteTwoTone/></IconButton>
        </Stack>)}
      </Stack>
      <Button onClick={handleItemAdd}>Generate new url</Button>
    </Paper>}

    <Stack direction='row' justifyContent='center' sx={{ pt: 2 }}>
      <LoadingButton sx={{ width: 300 }} variant='contained' loading={saving} onClick={save}>Save changes</LoadingButton>
    </Stack>

    <Backdrop open={loading} >
      <CircularProgress color="inherit"/>
    </Backdrop>
  </Box>
  );
};

export default PageSettingsModulesSystemsHighlights;