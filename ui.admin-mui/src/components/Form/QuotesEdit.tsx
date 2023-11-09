import { LoadingButton } from '@mui/lab';
import { Box, Button, Chip, Collapse, DialogContent, Divider, Grid, LinearProgress, TextField } from '@mui/material';
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete';
import { Quotes } from '@sogebot/backend/dest/database/entity/quotes';
import axios from 'axios';
import { capitalize, cloneDeep } from 'lodash';
import { useSnackbar } from 'notistack';
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import getAccessToken from '../../getAccessToken';
import { useTranslation } from '../../hooks/useTranslation';
import { useValidator } from '../../hooks/useValidator';

const newItem = new Quotes();
newItem.tags = [];
newItem.quote = '';

export const QuotesEdit: React.FC<{
  items: Quotes[]
  users: [userId: string, userName: string][]
}> = (props) => {
  const navigate = useNavigate();
  const { id } = useParams();

  const currentUser = useMemo(() => JSON.parse(localStorage['cached-logged-user']), []);
  const currentTags = Array.from(new Set(...props.items.map(o => o.tags)));

  const filter = createFilterOptions<string>();

  const { translate } = useTranslation();
  const [ item, setItem ] = useState<Quotes>(newItem);
  const [ quotedByUserName, setQuotedByUserName ] = useState('newItem');
  const [ loading, setLoading ] = useState(true);
  const [ saving, setSaving ] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const { propsError, reset, showErrors, validate, haveErrors } = useValidator();

  const handleValueChange = <T extends keyof Quotes>(key: T, value: Quotes[T]) => {
    if (!item) {
      return;
    }
    const update = cloneDeep(item);
    update[key] = value;
    setItem(update);
  };

  useEffect(() => {
    setLoading(true);
    newItem.quotedBy = currentUser.id;
    newItem.createdAt = new Date().toISOString();

    if (id) {
      const it = props.items?.find(o => o.id === Number(id)) ?? newItem;
      setItem(it);
      setQuotedByUserName((props.users.find(o => o[0] === it.quotedBy) || ['', 'unknown user'])[1]);
    } else {
      setItem(newItem);
      setQuotedByUserName(currentUser.login);
    }
    setLoading(false);
    reset();
  }, [id, props.items, props.users, reset, currentUser.id, currentUser.login]);

  useEffect(() => {
    if (!loading && item) {
      validate(Quotes, item);
    }
  }, [item, loading, validate]);

  const handleClose = () => {
    navigate('/manage/quotes');
  };

  const handleSave = () => {
    setSaving(true);
    axios.post(`${JSON.parse(localStorage.server)}/api/systems/Quotes`,
      item,
      { headers: { authorization: `Bearer ${getAccessToken()}` } })
      .then((response) => {
        enqueueSnackbar('Quotes saved.', { variant: 'success' });
        navigate(`/manage/quotes/edit/${response.data.data.id}`);
      })
      .catch(e => {
        showErrors(e.response.data.errors);
      })
      .finally(() => setSaving(false));
  };

  return(<>
    {loading && <LinearProgress />}
    <Collapse in={!loading} mountOnEnter unmountOnExit>
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
            freeSolo
            value={item.tags}
            options={currentTags}
            multiple
            renderTags={(value: readonly string[], getTagProps) =>
              value.map((option: string, index: number) => (
                <Chip size='small' color="primary" label={option} {...getTagProps({ index })} key={option} />
              ))
            }
            onChange={(event, newValue) => {
              handleValueChange('tags', newValue);
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                fullWidth
                variant="filled"
                label={translate('systems.quotes.tags.name')}
                placeholder='Start typing to add tag'
              />
            )}
            filterOptions={(opts, params) => {
              const filtered = filter(opts, params);

              const { inputValue: iv } = params;
              // Suggest the creation of a new value
              const isExisting = opts.some((option) => iv === option);
              if (iv !== '' && !isExisting) {
                filtered.push(iv);
              }

              return filtered;
            }}
          />
        </Box>
      </DialogContent>
    </Collapse>
    <Divider/>
    <Box sx={{ p: 1 }}>
      <Grid container sx={{ height: '100%' }} justifyContent={'end'} spacing={1}>
        <Grid item>
          <Button sx={{ width: 150 }} onClick={handleClose}>Close</Button>
        </Grid>
        <Grid item>
          <LoadingButton variant='contained' color='primary' sx={{ width: 150 }} onClick={handleSave} loading={saving} disabled={haveErrors || loading}>Save</LoadingButton>
        </Grid>
      </Grid>
    </Box>
  </>);
};