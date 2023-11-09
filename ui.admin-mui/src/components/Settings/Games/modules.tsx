import { Box, FormControlLabel, FormGroup, Grid, Switch, Typography } from '@mui/material';
import { SxProps, Theme } from '@mui/material/styles';
import capitalize from 'lodash/capitalize';
import { useSnackbar } from 'notistack';
import React, { useCallback, useEffect, useState } from 'react';
import { useRefElement } from 'rooks';

import { getSocket } from '../../../helpers/socket';
import { useAppDispatch, useAppSelector } from '../../../hooks/useAppDispatch';
import { useTranslation } from '../../../hooks/useTranslation';
import { addSettingsLoading, rmSettingsLoading } from '../../../store/loaderSlice';

const PageSettingsModulesGamesModules: React.FC<{
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
      dispatch(addSettingsLoading('/games/modules'));
    } else {
      dispatch(rmSettingsLoading('/games/modules'));
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

    getSocket(`/${item.type}/${item.name}` as any).emit('settings.update', { enabled }, (err: Error | null) => {
      if (err) {
        console.error(err);
        enqueueSnackbar(String(err), { variant: 'error' });
        return;
      } else {
        enqueueSnackbar(`Module ${item.name} ${enabled ? 'enabled' : 'disabled'}.`, { variant: enabled ? 'success' : 'info' });
      }
    });
  }, [ enqueueSnackbar ]);

  const refresh = useCallback(() => {
    getSocket('/').emit('populateListOf', 'games', (err, systems: any) => {
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
  }, [ refresh ]);

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
    <Typography variant='h2' sx={{ pb: 2 }}>{translate('menu.games')}</Typography>
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
export default PageSettingsModulesGamesModules;
