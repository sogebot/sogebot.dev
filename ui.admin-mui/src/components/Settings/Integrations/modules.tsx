import { Box, FormControlLabel, FormGroup, Grid, Switch, Typography } from '@mui/material';
import { SxProps, Theme } from '@mui/material/styles';
import axios from 'axios';
import capitalize from 'lodash/capitalize';
import { useSnackbar } from 'notistack';
import React, { useCallback, useEffect, useState } from 'react';
import { useRefElement } from 'rooks';

import getAccessToken from '../../../getAccessToken';
import { getSocket } from '../../../helpers/socket';
import { useAppDispatch, useAppSelector } from '../../../hooks/useAppDispatch';
import { useTranslation } from '../../../hooks/useTranslation';
import { addSettingsLoading, rmSettingsLoading } from '../../../store/loaderSlice';

const PageSettingsModulesIntegrationsModules: React.FC<{
  onVisible: () => void,
  sx?:       SxProps<Theme> | undefined
}> = ({
  onVisible,
  sx,
}) => {

  const { translate } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const dispatch = useAppDispatch();

  const [ loading, setLoading ] = useState(true);
  const [ items, setItems ] = useState<any[]>([]);

  useEffect(() => {
    if (loading) {
      dispatch(addSettingsLoading('/integrations/modules'));
    } else {
      dispatch(rmSettingsLoading('/integrations/modules'));
    }
  }, [loading, dispatch]);

  const toggle = useCallback((item: any) => {
    const enabled = !item.enabled;
    setItems((values: any[]) => {
      const idx = values.findIndex(o => o.type === item.type && o.name === item.name);
      if (idx >= 0) {
        values[idx] = {
          ...item, enabled,
        };
      } else {
        values.push({
          ...item, enabled,
        });
      }
      return [...values];
    });

    axios.post(`/api/settings/${item.type}/${item.name}`, { enabled }, {
      headers: {
        Authorization: `Bearer ${getAccessToken()}`
      }
    }).then(() => {
      enqueueSnackbar(`Module ${item.name} ${enabled ? 'enabled' : 'disabled'}.`, { variant: enabled ? 'success' : 'info' });
    }).catch(err => {
      enqueueSnackbar(String(err), { variant: 'error' });
    });
  }, [ enqueueSnackbar ]);

  const refresh = useCallback(() => {
    getSocket('/').emit('populateListOf', 'integrations', (err: any, systems: any) => {
      if (err) {
        console.error(err);
        return;
      }
      setItems((values: any[]) => {
        for (const system of systems.sort((a: any, b: any) => {
          return translate('menu.' + a.name).localeCompare(translate('menu.' + b.name));
        })) {
          if ('type' in system) {
            const idx = values.findIndex(o => o.type === system.type && o.name === system.name);
            if (idx >= 0) {
              values[idx] = system;
            } else {
              values.push(system);
            }
          }
        }
        setLoading(false);
        return [...values];
      });
    });
  }, [ translate ]);

  useEffect(() => {
    refresh();
  }, [ ]);

  const [ref, element]  = useRefElement<HTMLElement>();
  const scrollY = useAppSelector((state: any) => state.page.scrollY);
  useEffect(() => {
    if (element) {
      if (element.offsetTop < scrollY + 100 && element.offsetTop + element.clientHeight > scrollY - 100) {
        onVisible();
      }
    }
  }, [element, scrollY, onVisible]);

  return (<Box ref={ref} sx={sx} id="modules">
    <Typography variant='h2' sx={{ pb: 2 }}>{translate('menu.integrations')}</Typography>
    <Grid container>
      {items.map(item => <Grid key={item.name} item xs={12} sm={6} md={6} lg={3}>
        <FormGroup>
          <FormControlLabel control={<Switch checked={item.enabled} onClick={() => toggle(item)} />} label={capitalize(translate('menu.' + item.name).startsWith('{') ? item.name : translate('menu.' + item.name))} />
        </FormGroup>
      </Grid>)}
    </Grid>
  </Box>
  );
};
export default PageSettingsModulesIntegrationsModules;
