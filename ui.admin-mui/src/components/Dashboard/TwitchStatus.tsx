import {
  Backdrop, Grid, Paper, Skeleton,
  Typography,
} from '@mui/material';
import parse from 'html-react-parser';
import { capitalize, isNil } from 'lodash';
import React, { useEffect, useState } from 'react';

import { DashboardDialogSetGameAndTitle } from './Dialog/SetGameAndTitle';
import { getSocket } from '../../helpers/socket';
import { useAppSelector } from '../../hooks/useAppDispatch';
import { useTranslation } from '../../hooks/useTranslation';
import theme from '../../theme';
import { classes } from '../styles';

export const DashboardStatsTwitchStatus: React.FC = () => {
  const [hover, setHover] = useState(false);
  const [open, setOpen] = useState(false);

  const { translate } = useTranslation();
  const currentStats = useAppSelector(state => state.page.currentStats);

  const [title, setTitle] = useState<null | string>(null);
  const [cachedTitle, setCachedTitle] = useState<null | string>(null);

  const game = React.useMemo(() => currentStats.game, [currentStats.game]);
  const tags = React.useMemo(() => currentStats.tags, [currentStats.tags]);
  const rawStatus = React.useMemo(() => currentStats.rawStatus, [currentStats.rawStatus]);

  React.useEffect(() => {
    if (currentStats.status && currentStats.rawStatus) {
      generateTitle(currentStats.status, currentStats.rawStatus).then(setTitle);
    }
  }, [currentStats.status, currentStats.rawStatus]);

  useEffect(() => {
    setHover(false);
  }, [open]);

  const loadCustomVariableValue = (variable: string) => {
    return new Promise<string>((resolve) => {
      getSocket('/').emit('custom.variable.value', variable, (err, value) => {
        if (err) {
          console.error(err);
        }
        resolve(value);
      });
    });
  };

  const generateTitle = async (current: string, raw: string) => {
    if (raw.length === 0) {
      return current;
    }

    const variables = raw.match(/(\$_[a-zA-Z0-9_]+)/g);
    if (cachedTitle === current && isNil(variables)) {
      return cachedTitle;
    }

    if (!isNil(variables)) {
      for (const variable of variables) {
        const value = await loadCustomVariableValue(variable);
        raw = raw.replace(variable, `<strong style="border-bottom: 1px dotted gray" title="${variable}">${value}</strong>`);
      }
    }
    setCachedTitle(raw);
    return raw;
  };

  return (
    <Grid item xs={12} sm={12} md={12} lg={12} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <Paper sx={{
        p: 0.5, overflow: 'hidden', ...classes.parent,
      }}>
        <Grid container justifyContent={'left'}>
          <Grid item sm={12} xs={12}>
            {!game || !title
              ? <Skeleton sx={{
                width: '200px', position: 'relative', top: '4px',
              }} component={Typography}/>
              : <Typography sx={{
                transform: 'translateY(5px)', ...classes.truncate,
              }}>
                <Typography component="span" sx={{
                  color: theme.palette.primary.main, fontWeight: 'bold',
                }}>
                  { game }
                </Typography>
                {' '}
                {parse(title)}
                {' '}
                {tags.map((tag) => {
                  return(<Typography component="span" key={tag} sx={{ color: theme.palette.primary.main }}>
                #{ tag.toLocaleLowerCase() }{' '}
                  </Typography>);
                })}</Typography>
            }
            <Typography color={theme.palette.grey[400]} variant='caption' sx={{
              pt: 2, pa: 1,
            }}>{ capitalize(translate('game')) }, { capitalize(translate('title')) }, { capitalize(translate('tags')) }</Typography>
          </Grid>
        </Grid>
        { game && <Backdrop open={hover} sx={classes.backdrop} onClick={() => setOpen(true)}>
          <Typography variant="button">{translate('click-to-change')}</Typography>
        </Backdrop>}
      </Paper>

      {game && <DashboardDialogSetGameAndTitle open={open} setOpen={setOpen} game={game || ''} title={rawStatus || ''} tags={tags || []}/>}
    </Grid>
  );
};