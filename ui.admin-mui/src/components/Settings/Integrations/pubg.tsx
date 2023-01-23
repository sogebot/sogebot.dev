import { LoadingButton } from '@mui/lab';
import {
  Alert,
  Box,
  CircularProgress,
  FormControl,
  FormLabel,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { flatten } from '@sogebot/backend/dest/helpers/flatten';
import { JsonViewer, NamedColorspace } from '@textea/json-viewer';
import { escapeRegExp } from 'lodash';
import React from 'react';
import { useSelector } from 'react-redux';
import { useDebouncedValue, useRefElement } from 'rooks';

import { getSocket } from '../../../helpers/socket';
import { useSettings } from '../../../hooks/useSettings';
import { useTranslation } from '../../../hooks/useTranslation';

const ocean: NamedColorspace = {
  scheme: 'Ocean',
  author: 'Chris Kempson (http://chriskempson.com)',
  base00: '#2b303b',
  base01: '#343d46',
  base02: '#4f5b66',
  base03: '#65737e',
  base04: '#a7adba',
  base05: '#c0c5ce',
  base06: '#dfe1e8',
  base07: '#eff1f5',
  base08: '#bf616a',
  base09: '#d08770',
  base0A: '#ebcb8b',
  base0B: '#a3be8c',
  base0C: '#96b5b4',
  base0D: '#8fa1b3',
  base0E: '#b48ead',
  base0F: '#ab7967',
};

const PageSettingsModulesIntegrationsPUBG: React.FC<{
  onVisible: () => void,
}> = ({
  onVisible,
}) => {

  const { translate } = useTranslation();

  const { settings, loading, refresh, save, saving, errors, TextFieldProps, handleChange } = useSettings('/integrations/pubg' as any);

  const [example1, setExample1 ] = React.useState(`Stats not fetched or your user doesn't played any ranked yet`);
  const [example2, setExample2 ] = React.useState(`Stats not fetched or your user doesn't played any ranked yet`);

  const [selectedRankedStats, setSelectedRankedStats] = React.useState('');
  const [selectedNormalStats, setSelectedNormalStats ] = React.useState('');

  const updateExample = React.useCallback((value: string, statsType: string, stats: Record<string, any>) => {
    const noValues = `Stats not fetched or your user doesn't played any ranked yet`;
    const selected = statsType === 'rankedGameModeStats' ? selectedRankedStats : selectedNormalStats;
    console.log({ selected });
    if (selected === '') {
      const noSelect = 'Please select category before we can show you example stats.';
      if (statsType === 'rankedGameModeStats') {
        setExample1(noSelect);
      } else {
        setExample2(noSelect);
      }
      return;
    }

    if (Object.keys(stats).length === 0) {
      if (statsType === 'rankedGameModeStats') {
        setExample1(noValues);
      } else {
        setExample2(noValues);
      }
      return;
    }

    const dataset = stats[selected];
    let text = value || '';
    for (const key of Object.keys(flatten(dataset))) {
      text = text.replace(new RegExp(escapeRegExp(`$${key}`), 'gi'), flatten(dataset)[key]);
    }
    getSocket(`/integrations/pubg`).emit('pubg::exampleParse', { text }, (err, data: any) => {
      if (err) {
        return console.error(err);
      } else if (statsType === 'rankedGameModeStats') {
        setExample1(data);
      } else {
        setExample2(data);
      }
    });
  }, [selectedRankedStats, selectedNormalStats]);

  React.useEffect(() => {
    refresh().then((values) => {
      updateExample(values.customization.rankedGameModeStatsCustomization[0], 'rankedGameModeStats', values.stats.rankedGameModeStats[0]);
      updateExample(values.customization.gameModeStatsCustomization[0], 'gameModeStats', values.stats.gameModeStats[0]);
    });
  }, [ refresh, updateExample ]);

  const [ref, element]  = useRefElement<HTMLElement>();
  const scrollY = useSelector<number, number>((state: any) => state.page.scrollY);
  React.useEffect(() => {
    if (element) {
      if (element.offsetTop < scrollY + 100 && element.offsetTop + element.clientHeight > scrollY - 100) {
        onVisible();
      }
    }
  }, [element, scrollY, onVisible]);

  const [ search, setSearch ] = React.useState(false);
  const [debouncedSearchTerm] = useDebouncedValue(settings?.player.playerName[0], 1000);
  const [ lastSearch, setLastSearch ] = React.useState('');
  React.useEffect(() => {
    if (debouncedSearchTerm && settings && !search && lastSearch !== debouncedSearchTerm) {
      setLastSearch(debouncedSearchTerm);
      setSearch(true);
      getSocket(`/integrations/pubg`).emit('pubg::searchForPlayerId', {
        apiKey:     settings.apiKey[0],
        platform:   settings.player.platform[0],
        playerName: settings.player.playerName[0],
      }, (err, data: any) => {
        if (err) {
          console.error(err);
          handleChange('player.playerId', '');
        } else {
          handleChange('player.playerId', data.data[0].id);
        }
        setSearch(false);
      });
    }
  }, [ debouncedSearchTerm, settings, search, lastSearch, handleChange ]);

  return (loading ? null : <Box ref={ref} id="pubg">
    <Typography variant='h2' sx={{ pb: 2 }}>{ translate('menu.pubg') }</Typography>
    {settings && <Paper elevation={1} sx={{ p: 1 }}>
      <Stack spacing={1}>
        <TextField
          {...TextFieldProps('apiKey', { helperText: translate('integrations.pubg.settings.apiKey.help') })}
          type="password"
          label={translate('integrations.pubg.settings.apiKey.title')}
        />
        <FormControl variant="filled" sx={{ minWidth: 300 }}>
          <InputLabel id="platform-label" shrink>{translate('integrations.pubg.settings.platform')}</InputLabel>
          <Select
            labelId="platform-label"
            id="platform-select"
            value={settings.player.platform[0]}
            label={translate('integrations.pubg.settings.platform')}
            displayEmpty
            onChange={(event) => handleChange('player.platform', event.target.value)}
          >
            <MenuItem value="steam">steam</MenuItem>
            <MenuItem value="console">console</MenuItem>
            <MenuItem value="kakao">kakao</MenuItem>
            <MenuItem value="psn">psn</MenuItem>
            <MenuItem value="stadia">stadia</MenuItem>
            <MenuItem value="xbox">xbox</MenuItem>
          </Select>
        </FormControl>
        <TextField
          {...TextFieldProps('player.playerName')}
          label={translate('integrations.pubg.settings.playerName')}
          InputProps={{
            endAdornment: <InputAdornment position="end">
              {search
                ? <CircularProgress size={20}/>
                : settings.player.playerId[0] === '' ? 'unknown user' : settings.player.playerId[0]
              }
            </InputAdornment>,
          }}
        />
      </Stack>
    </Paper>}

    <Typography variant='h5' sx={{ py: 2 }}>{ translate('categories.customization') }</Typography>
    {settings && <Paper elevation={1} sx={{ p: 1 }}>
      <Stack spacing={1}>
        <Grid container>
          <Grid item xs>
            <TextField
              {...TextFieldProps('customization.rankedGameModeStatsCustomization', {
                helperText: example1, onChange: (value) => updateExample(value, 'rankedGameModeStats', settings.stats.rankedGameModeStats[0]),
              })}
              label={translate('integrations.pubg.settings.rankedGameModeStatsCustomization')}
            />
          </Grid>
          <Grid item>
            <FormControl fullWidth variant='filled'>
              <InputLabel id="rankedGameModeStatsCustomization-label" shrink></InputLabel>
              <Select
                labelId="rankedGameModeStatsCustomization-label"
                id="rankedGameModeStatsCustomization-select"
                displayEmpty
                variant='filled'
                value={selectedRankedStats}
                onChange={(event) => setSelectedRankedStats(event.target.value)}
              >
                <MenuItem value={''}>-- please select example --</MenuItem>
                {Object.keys(settings.stats.rankedGameModeStats[0]).map(key => <MenuItem value={key} key={key}>{key}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        <Grid container>
          <Grid item xs>
            <TextField
              {...TextFieldProps('customization.gameModeStatsCustomization', {
                helperText: example2, onChange: (value) => updateExample(value, 'gameModeStats', settings.stats.gameModeStats[0]),
              })}
              label={translate('integrations.pubg.settings.gameModeStatsCustomization')}
            />
          </Grid>
          <Grid item>
            <FormControl fullWidth variant='filled'>
              <InputLabel id="gameModeStatsCustomization-label" shrink></InputLabel>
              <Select
                labelId="gameModeStatsCustomization-label"
                id="gameModeStatsCustomization-select"
                displayEmpty
                variant='filled'
                value={selectedNormalStats}
                onChange={(event) => setSelectedNormalStats(event.target.value)}
              >
                <MenuItem value={''}>-- please select example --</MenuItem>
                {Object.keys(settings.stats.gameModeStats[0]).map(key => <MenuItem value={key} key={key}>{key}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <div>
          <FormLabel>{ translate('integrations.pubg.player_stats_ranked') }</FormLabel>
          <JsonViewer
            value={settings.stats.rankedGameModeStats[0]}
            theme={ocean}
            style={{ padding: '10px' }}
            displayDataTypes={false}
            displayObjectSize={false}
            enableClipboard={false}
          />
          <Alert severity="info">{ translate('integrations.pubg.stats_are_automatically_refreshed_every_10_minutes') }</Alert>
        </div>

        <div>
          <FormLabel>{ translate('integrations.pubg.player_stats') }</FormLabel>
          <JsonViewer
            value={settings.stats.gameModeStats[0]}
            theme={ocean}
            style={{ padding: '10px' }}
            displayDataTypes={false}
            displayObjectSize={false}
            enableClipboard={false}
          />
          <Alert severity="info">{ translate('integrations.pubg.stats_are_automatically_refreshed_every_10_minutes') }</Alert>

        </div>
      </Stack>
    </Paper>}

    <Stack direction='row' justifyContent='center' sx={{ pt: 2 }}>
      <LoadingButton sx={{ width: 300 }} variant='contained' loading={saving} onClick={save} disabled={errors.length > 0}>Save changes</LoadingButton>
    </Stack>
  </Box>
  );
};

export default PageSettingsModulesIntegrationsPUBG;
