import {
  Backdrop, Grid, Paper, Typography,
} from '@mui/material';
import LinearProgress from '@mui/material/LinearProgress';
import { Box } from '@mui/system';
import { capitalize, isNil } from 'lodash';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useDidMount } from 'rooks';

import { DashboardDialogSetGameAndTitle } from '~/src/components/Dashboard/Dialog/SetGameAndTitle';
import { classes } from '~/src/components/styles';
import { getSocket } from '~/src/helpers/socket';
import { useTranslation } from '~/src/hooks/useTranslation';
import theme from '~/src/theme';

export const DashboardStatsTwitchStatus: React.FC = () => {
  const [hover, setHover] = useState(false);
  const [open, setOpen] = useState(false);

  const { configuration } = useSelector((state: any) => state.loader);
  const { translate } = useTranslation();

  const [game, setGame] = useState<null | string>(null);
  const [title, setTitle] = useState<null | string>(null);
  const [rawTitle, setRawTitle] = useState<null | string>(null);
  const [cachedTitle, setCachedTitle] = useState<null | string>(null);
  const [tags, setTags] = useState<{ is_auto: boolean; localization_names: { [x:string]: string } }[]>([]);

  const [loading, setLoading] = useState(true);

  useDidMount(() => {
    getSocket('/').on('panel::stats', async (data: Record<string, any>) => {
      setGame(data.game);
      setTitle(await generateTitle(data.status, data.rawStatus));
      setTags(data.tags);
      setRawTitle(data.rawStatus);
      setLoading(false);
    });
  });

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

  const filterTags = (is_auto: boolean) => {
    return tags.filter(o => !!o.is_auto === is_auto).map((o) => {
      const key = Object.keys(o.localization_names).find(key2 => key2.includes(configuration.lang));
      return {
        name: o.localization_names[key || 'en-us'], is_auto: !!o.is_auto, 
      };
    }).sort((a, b) => {
      if ((a || { name: '' }).name < (b || { name: '' }).name) { // sort string ascending
        return -1;
      }
      if ((a || { name: '' }).name > (b || { name: '' }).name) {
        return 1;
      }
      return 0; // default return value (no sorting)
    });
  };

  return (
    <Grid item xs={12} sm={12} md={12} lg={12} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <Paper sx={{
        p: 0.5, overflow: 'hidden', ...classes.parent,
      }}>
        {loading && <Box sx={{
          width: '100%', position: 'absolute', top: '0', left: '0',
        }}>
          <LinearProgress />
        </Box>}

        <Grid container justifyContent={'left'}>
          <Grid item sm={4} xs={12}>
            <Typography sx={{
              transform: 'translateY(5px)', ...classes.truncate, 
            }}>{ game ?? capitalize(translate('not-available')) }</Typography>
            <Typography color={theme.palette.grey[400]} variant='caption' sx={{
              pt: 2, pa: 1, 
            }}>{ capitalize(translate('game')) }</Typography>
          </Grid>
          <Grid item sm={4} xs={12}>
            <Typography sx={{
              transform: 'translateY(5px)', ...classes.truncate, 
            }}>{ title ?? capitalize(translate('not-available')) }</Typography>
            <Typography color={theme.palette.grey[400]} variant='caption' sx={{
              pt: 2, pa: 1, 
            }}>{ capitalize(translate('title')) }</Typography>
          </Grid>
          <Grid item sm={4} xs={12}>
            <Typography sx={{
              transform: 'translateY(5px)', ...classes.truncate, 
            }}>
              { tags.length === 0 && <Typography component="span">{capitalize(translate('not-available'))}</Typography> }
              {filterTags(true).map((tag, idx) => {
                return(<Typography component="span" key={tag.name} sx={tag.is_auto ? classes.greyColor : {}}>
                  { tag.name }
                  {(idx + 1) < tags.length && <Typography component="span" sx={classes.whiteColor}>,&nbsp;</Typography>}
                </Typography>);
              })}
              {filterTags(false).map((tag, idx) => {
                return(<Typography key={tag.name} sx={tag.is_auto ? classes.greyColor : {}}>
                  { tag.name }
                  {(idx + 1) < tags.length && <Typography component="span" sx={classes.whiteColor}>,&nbsp;</Typography>}
                </Typography>);
              })}
            </Typography>
            <Typography color={theme.palette.grey[400]} variant='caption' sx={{
              pt: 2, pa: 1, 
            }}>{ capitalize(translate('tags')) }</Typography>
          </Grid>
        </Grid>
        {!loading && <Backdrop open={hover} sx={classes.backdrop} onClick={() => setOpen(true)}>
          <Typography variant="button">{translate('click-to-change')}</Typography>
        </Backdrop>}
      </Paper>

      {!loading && <DashboardDialogSetGameAndTitle open={open} setOpen={setOpen} game={game || ''} title={rawTitle || ''}/>}
    </Grid>
  );
};