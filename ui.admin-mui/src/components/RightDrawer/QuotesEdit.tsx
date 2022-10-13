import { Quotes } from '@entity/quotes';
import { LoadingButton } from '@mui/lab';
import {
  Box, Button, CircularProgress, Dialog, DialogContent, Divider, Fade, Grid, TextField,
} from '@mui/material';
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete';
import axios from 'axios';
import { validateOrReject } from 'class-validator';
import {
  capitalize,
  merge,
} from 'lodash';
import { useRouter } from 'next/router';
import { useSnackbar } from 'notistack';
import {
  useCallback, useMemo, useState,
} from 'react';
import { useEffect } from 'react';

import getAccessToken from '~/src/getAccessToken';
import { useTranslation } from '~/src/hooks/useTranslation';
import { useValidator } from '~/src/hooks/useValidator';
import { StripTypeORMEntity } from '~/src/types/stripTypeORMEntity';

const newItem = new Quotes();
newItem.tags = [];
newItem.quote = '';

export const QuotesEdit: React.FC<{
  items: Quotes[]
  users: [userId: string, userName: string][]
}> = (props) => {

  const currentUser = useMemo(() => JSON.parse(localStorage['cached-logged-user']), []);
  const currentTags = Array.from(new Set(...props.items.map(o => o.tags)));
  const tagsItems = currentTags.map(tag => ({
    title: tag, value: tag,
  }));

  const filter = createFilterOptions<typeof tagsItems[number]>();

  const router = useRouter();
  const { translate } = useTranslation();
  const [ editDialog, setEditDialog ] = useState(false);
  const [ item, setItem ] = useState<StripTypeORMEntity<Quotes>>(newItem);
  const [ quotedByUserName, setQuotedByUserName ] = useState('newItem');
  const [ loading, setLoading ] = useState(true);
  const [ saving, setSaving ] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const { propsError, reset, setErrors, validate, haveErrors } = useValidator();

  const handleValueChange = useCallback(<T extends keyof Quotes>(key: T, value: Quotes[T]) => {
    setItem(i => ({
      ...i, [key]: value,
    }));
  }, []);

  useEffect(() => {
    setLoading(true);
    newItem.quotedBy = currentUser.id;
    newItem.createdAt = new Date().toISOString();

    if (router.query.id) {
      const it = props.items?.find(o => o.id === Number(router.query.id)) ?? newItem;
      setItem(it);
      setQuotedByUserName((props.users.find(o => o[0] === it.quotedBy) || ['', 'unknown user'])[1]);
    } else {
      setItem(newItem);
      setQuotedByUserName(currentUser.login);
    }
    setLoading(false);
    reset();
  }, [router.query.id, props.items, props.users, editDialog, reset, currentUser.id, currentUser.login]);

  useEffect(() => {
    if (!loading && editDialog && item) {
      const toCheck = new Quotes();
      merge(toCheck, item);
      console.log('Validating', toCheck);
      validateOrReject(toCheck)
        .then(() => setErrors(null))
        .catch(setErrors);
    }
  }, [item, loading, editDialog, setErrors]);

  useEffect(() => {
    if (router.asPath.includes('quotes/edit/') || router.asPath.includes('quotes/create') ) {
      setEditDialog(true);
    }
  }, [router]);

  const handleClose = () => {
    setEditDialog(false);
    setTimeout(() => {
      router.push('/manage/quotes');
    }, 200);
  };

  const handleSave = () => {
    setSaving(true);
    axios.post(`${localStorage.server}/api/systems/Quotes`,
      item,
      { headers: { authorization: `Bearer ${getAccessToken()}` } })
      .then((response) => {
        enqueueSnackbar('Quotes saved.', { variant: 'success' });
        router.push(`/manage/quotes/edit/${response.data.data.id}`);
      })
      .catch(e => {
        validate(e.response.data.errors);
      })
      .finally(() => setSaving(false));
  };

  return(<Dialog
    open={editDialog}
    fullWidth
    maxWidth='md'
  >
    {loading
      ? <Grid
        sx={{ p: 5 }}
        container
        direction="column"
        justifyContent="flex-start"
        alignItems="center"
      ><CircularProgress color="inherit" /></Grid>
      : <Fade in={!loading}>
        <DialogContent>
          <Box
            component="form"
            sx={{ '& .MuiFormControl-root': { my: 0.5 } }}
            noValidate
            autoComplete="off"
          >
            <TextField
              fullWidth
              {...propsError('name')}
              variant="filled"
              value={item?.quote || ''}
              required
              multiline
              onKeyPress={(e) => {
                e.key === 'Enter' && e.preventDefault();
              }}
              label={capitalize(translate('systems.quotes.quote.name'))}
              onChange={(event) => handleValueChange('quote', event.target.value)}
            />

            <TextField
              fullWidth
              {...propsError('name')}
              variant="filled"
              value={quotedByUserName}
              disabled
              label={capitalize(translate('systems.quotes.by.name'))}
            />

            <Autocomplete
              fullWidth
              value={item.tags.map(o => ({
                title: o, value: o,
              }))}
              multiple
              onChange={(event, newValue) => {
                if (Array.isArray(newValue)) {
                  handleValueChange('tags', newValue.map(o => typeof o === 'string' ? o : o.value));
                }
              }}
              filterOptions={(options, params) => {
                const filtered = filter(options, params);

                const { inputValue } = params;
                // Suggest the creation of a new value
                const isExisting = options.some((option) => inputValue === option.title);
                if (inputValue !== '' && !isExisting) {
                  filtered.push({
                    value: inputValue,
                    title: `Add tag "${inputValue}"`,
                  });
                }

                return filtered;
              }}
              selectOnFocus
              clearOnBlur
              handleHomeEndKeys
              options={tagsItems}
              getOptionLabel={(option) => {
                // Value selected with enter, right from the input
                if (typeof option === 'string') {
                  return option;
                }
                // Add "xxx" option created dynamically
                if (option.value) {
                  return option.value;
                }
                // Regular option
                return option.title;
              }}
              renderOption={(_props, option) => <li {..._props}>{option.title}</li>}
              isOptionEqualToValue={(option, v) => {
                return option.value === v.value;
              }}
              ChipProps={{
                size:  'small',
                color: 'primary',
              }}
              freeSolo
              renderInput={(params) => (
                <TextField
                  {...params}
                  fullWidth
                  variant="filled"
                  label={translate('systems.quotes.tags.name')}
                  placeholder='Start typing to add tag'
                />
              )}
            />
          </Box>
        </DialogContent>
      </Fade>}
    <Divider/>
    <Box sx={{ p: 1 }}>
      <Grid container sx={{ height: '100%' }} justifyContent={'end'} spacing={1}>
        <Grid item>
          <Button sx={{ width: 150 }} onClick={handleClose}>Close</Button>
        </Grid>
        <Grid item>
          <LoadingButton variant='contained' color='primary' sx={{ width: 150 }} onClick={handleSave} loading={saving} disabled={haveErrors}>Save</LoadingButton>
        </Grid>
      </Grid>
    </Box>
  </Dialog>);
};