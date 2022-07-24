import { mdiCrown } from '@mdi/js';
import Icon from '@mdi/react';
import {
  Adjust, Cast, Diamond, Favorite, Mic, MicOff, MonetizationOn, NotificationsActive, NotificationsOff, Redeem, SkipNext, Tv, VolumeOff, VolumeUp,
} from '@mui/icons-material';
import {
  Backdrop, Box, IconButton, List, ListItem, ListItemIcon, ListItemText, Tooltip, Typography,
} from '@mui/material';
import {
  blue, deepPurple, green, grey, indigo, lightBlue, lime, orange, pink, yellow,
} from '@mui/material/colors';
import { dayjs } from '@sogebot/ui-helpers/dayjsHelper';
import parse from 'html-react-parser';
import get from 'lodash/get';
import React, { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import { useDidMount } from 'rooks';
import SimpleBar from 'simplebar-react';

import 'simplebar-react/dist/simplebar.min.css';
import { DashboardWidgetBotDialogFilterEvents } from '~/src/components/Dashboard/Widget/Bot/Dialog/FilterEvents';
import { getSocket } from '~/src/helpers/socket';
import { useStyles } from '~/src/hooks/useStyles';
import { useTranslation } from '~/src/hooks/useTranslation';
import theme from '~/src/theme';

export const DotDivider: React.FC = () => {
  return (
    <Typography component='span' fontSize={'0.8rem'} color={grey[500]}>•</Typography>
  );
};

function blockquote (event: any) {
  const values = JSON.parse(event.values_json);
  if (values.message) {
    return `${values.message.replace(/(\w{10})/g, '$1<wbr>')}`;
  } // will force new line for long texts

  return '';
}

function emitSkipAlertEvent () {
  console.log('Skipping current alert');
  getSocket('/widgets/eventlist').emit('skip');
}

function resendAlert (id: string) {
  console.log(`resendAlert => ${id}`);
  getSocket('/widgets/eventlist').emit('eventlist::resend', id);
}

function RenderRow(props: any) {
  const [hover, setHover] = useState(false);
  const { translate } = useTranslation();
  const { configuration } = useSelector((state: any) => state.loader);
  const classes = useStyles();

  const prepareMessage = useCallback((event: any) => {
    let t = translate(`eventlist-events.${event.event}`);

    const values = JSON.parse(event.values_json);
    if (event.event === 'tip' && values.charityCampaignName) {
      t = translate(`eventlist-events.tipToCharity`);
    }
    const formattedAmount = Intl.NumberFormat(configuration.lang, { style: 'currency', currency: get(values, 'currency', 'USD') }).format(get(values, 'amount', '0'));
    t = t.replace('$formatted_amount', '<strong style="font-size: 1rem">' + formattedAmount + '</strong>');
    t = t.replace('$viewers', '<strong style="font-size: 1rem">' + get(values, 'viewers', '0') + '</strong>');

    t = t.replace('$subType', get(values, 'tier', 'Prime') !== 'Prime' ? `Tier ${get(values, 'tier', 'Prime')}` : 'Prime' );
    t = t.replace('$viewers', get(values, 'viewers', '0'));
    t = t.replace('$username', get(values, 'fromId', 'n/a'));
    t = t.replace('$subCumulativeMonthsName', get(values, 'subCumulativeMonthsName', 'months'));
    t = t.replace('$subCumulativeMonths', get(values, 'subCumulativeMonths', '0'));
    t = t.replace('$subStreakName', get(values, 'subStreakName', 'months'));
    t = t.replace('$subStreak', get(values, 'subStreak', '0'));
    t = t.replace('$bits', get(values, 'bits', '0'));
    t = t.replace('$count', get(values, 'count', '0'));
    t = t.replace('$titleOfReward', get(values, 'titleOfReward', ''));
    t = t.replace('$campaignName', get(values, 'charityCampaignName', ''));

    let output = `${t}`;
    if (values.song_url && values.song_title) {
      output += `<strong>${translate('song-request')}:</strong> <a href="${values.song_url}">${values.song_title}</a>`;
    }
    return output;
  }, [translate, configuration]);

  return (
    <ListItem component="div" divider={true} dense key={props.item.id} className={classes.parent} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <ListItemIcon>
        {props.item.event === 'follow' && <Favorite htmlColor={pink[400]}/>}
        {props.item.event === 'rewardredeem' && <Adjust htmlColor={orange[300]}/>}
        {props.item.event === 'tip' && <MonetizationOn htmlColor={green[300]}/>}
        {props.item.event === 'resub' && <Icon size={1} path={mdiCrown} horizontal vertical color={blue[300]} rotate={180}/>}
        {props.item.event === 'sub' && <Icon size={1} path={mdiCrown} horizontal vertical color={lightBlue[300]} rotate={180}/>}
        {props.item.event === 'host' && <Tv htmlColor={deepPurple[300]}/>}
        {props.item.event === 'raid' && <Cast htmlColor={lime[300]}/>}
        {props.item.event === 'subgift' && <Redeem htmlColor={pink[300]}/>}
        {props.item.event === 'subcommunitygift' && <Redeem htmlColor={indigo[300]}/>}
        {props.item.event === 'cheer' && <Diamond htmlColor={yellow[300]}/>}
      </ListItemIcon>
      <ListItemText primary={<Box>
        {props.item.event === 'rewardredeem' && <>
          <Typography component="span" fontWeight={'bold'} pr={0.5}>{ JSON.parse(props.item.values_json).titleOfReward }</Typography>
          <DotDivider/>
          <Typography component="span" px={0.5}>{ props.item.username }</Typography>
        </>}
        {['follow', 'resub', 'tip', 'sub', 'host', 'raid', 'subgift', 'subcommunitygift'].includes(props.item.event) && <Typography component="span" fontWeight={'bold'} pr={0.5}>{ props.item.username }</Typography>}
        <DotDivider/>
        {props.item.event !== 'rewardredeem' && <>
          <Typography component="span" fontSize={'0.8rem'} pr={0.5}>&nbsp;{parse(prepareMessage(props.item))}</Typography>
          <DotDivider/>
        </>}
        <Typography  component="span" fontSize={'0.8rem'} pl={0.5} color={grey[500]}>{dayjs(props.item.timestamp).fromNow()}</Typography>
      </Box>
      } secondary={blockquote(props.item).length > 0 && <Typography component="span" variant="body2" fontStyle='italic' color={grey[500]}>{ parse(blockquote(props.item)) }</Typography>}/>

      {props.item.event === 'tip' && <Typography color={green[300]} fontSize={'1.2rem'}>{ Intl.NumberFormat(configuration.lang, { style: 'currency', currency: get(JSON.parse(props.item.values_json), 'currency', 'USD') }).format(get(JSON.parse(props.item.values_json), 'amount', '0')) }</Typography>}
      {props.item.event === 'cheer' && <Typography color={orange[300]} fontSize={'1.2rem'}>{ get(JSON.parse(props.item.values_json), 'amount', '0') }</Typography>}

      <Backdrop open={hover} className={classes.backdrop} onClick={() => resendAlert(props.item.id)}>
        <Typography variant="button">Resend Alert</Typography>
      </Backdrop>
    </ListItem>
  );
}

export const DashboardWidgetBotEvents: React.FC<{ className: string }> = (props) => {
  const [ events, setEvents ] = React.useState<any[]>([]);
  const { events: widgetSettings } = useSelector((state: any) => state.page.widgets);

  const [ status, setStatus ] = React.useState({
    areAlertsMuted: false,
    isSoundMuted:   false,
    isTTSMuted:     false,
  });
  const [ statusLoaded, setStatusLoaded ] = React.useState(false);

  const handleStatusChange = (type: keyof typeof status, value: boolean) => {
    setStatus({
      ...status,
      [type]: value,
    });
  };
  React.useEffect(() => {
    getSocket('/registries/alerts').emit('alerts::settings', null, (data) => {
      setStatus(data);
      setStatusLoaded(true);
    });
  }, []);

  React.useEffect(() => {
    if (!statusLoaded) {
      return;
    }
    getSocket('/registries/alerts').emit('alerts::settings', status, () => {
      return;
    });
  }, [ status, statusLoaded ]);

  const filteredEvents = React.useMemo(() => {
    return events.filter(event => {
      const follow = widgetSettings.showFollows && event.event === 'follow';
      const host = widgetSettings.showHosts && event.event === 'host';
      const raid = widgetSettings.showRaids && event.event === 'raid';
      const bit = widgetSettings.showBits && event.event === 'cheer';
      const redeem = widgetSettings.showRedeems && event.event === 'rewardredeem';

      const tip = widgetSettings.showTips && event.event === 'tip';
      const tipMinimal = !widgetSettings.showTipsMinimal || (widgetSettings.showTipsMinimal && event.sortAmount >= widgetSettings.showTipsMinimalAmount);

      const resub = widgetSettings.showResubs && event.event === 'resub';
      const months = JSON.parse(event.values_json).subCumulativeMonths ?? 0;
      const tier = JSON.parse(event.values_json).tier ?? 1;
      const resubMinimal = !widgetSettings.showResubsMinimal || (widgetSettings.showResubsMinimal && months >= widgetSettings.showResubsMinimalAmount);
      const resubPrime = widgetSettings.showResubsPrime && tier === 'Prime';
      const resubTier1 = widgetSettings.showResubsTier1 && Number(tier) === 1;
      const resubTier2 = widgetSettings.showResubsTier2 && Number(tier) === 2;
      const resubTier3 = widgetSettings.showResubsTier3 && Number(tier) === 3;

      const sub = widgetSettings.showSubs && event.event === 'sub';
      const subPrime = widgetSettings.showSubsPrime && tier === 'Prime';
      const subTier1 = widgetSettings.showSubsTier1 && Number(tier) === 1;
      const subTier2 = widgetSettings.showSubsTier2 && Number(tier) === 2;
      const subTier3 = widgetSettings.showSubsTier3 && Number(tier) === 3;

      const subgift = widgetSettings.showSubGifts && event.event === 'subgift';
      const subcommunitygift = widgetSettings.showSubCommunityGifts && event.event === 'subcommunitygift';

      return follow
            || redeem
            || host
            || raid
            || (tip && tipMinimal)
            || bit
            || (resub && resubMinimal && (resubPrime || resubTier1 || resubTier2 || resubTier3))
            || (sub && (subPrime || subTier1 || subTier2 || subTier3))
            || subgift
            || subcommunitygift;
    });
  }, [ events, widgetSettings ]);

  useDidMount(() => {
    getSocket('/widgets/eventlist').on('askForGet', () => getSocket('/widgets/eventlist').emit('eventlist::get', 100));
    getSocket('/widgets/eventlist').on('update', (values: any) => {
      setEvents(values);
    });
    getSocket('/widgets/eventlist').emit('eventlist::get', 100);
    setInterval(() => getSocket('/widgets/eventlist').emit('eventlist::get', 100), 60000);
  });

  return (<Box className={props.className} sx={{ height: '100%' }}>
    <Box sx={{
      borderBottom: 1, borderColor: 'divider', backgroundColor: theme.palette.grey[900],
    }}>
      <DashboardWidgetBotDialogFilterEvents/>
      <Tooltip title="Skip Alert">
        <IconButton onClick={emitSkipAlertEvent}><SkipNext/></IconButton>
      </Tooltip>
      <Tooltip title={status.isTTSMuted ? 'TTS disabled!' : 'TTS enabled!'}>
        <IconButton onClick={() => handleStatusChange('isTTSMuted', !status.isTTSMuted)}>
          {!status.isTTSMuted && <Mic/>}
          {status.isTTSMuted && <MicOff/>}
        </IconButton>
      </Tooltip>
      <Tooltip title={status.isSoundMuted ? 'Sound is disabled!' : 'Sound is enabled!'}>
        <IconButton onClick={() => handleStatusChange('isSoundMuted', !status.isSoundMuted)}>
          {!status.isSoundMuted && <VolumeUp/>}
          {status.isSoundMuted && <VolumeOff/>}
        </IconButton>
      </Tooltip>
      <Tooltip title={status.areAlertsMuted ? 'Alerts are muted!' : 'Alerts are enabled!'}>
        <IconButton onClick={() => handleStatusChange('areAlertsMuted', !status.areAlertsMuted)}>
          {!status.areAlertsMuted && <NotificationsActive/>}
          {status.areAlertsMuted && <NotificationsOff/>}
        </IconButton>
      </Tooltip>
    </Box>
    <SimpleBar style={{ maxHeight: 'calc(100% - 40px)' }} autoHide={false}>
      <List disablePadding>
        {filteredEvents.map(event => <RenderRow item={event} key={event.id}/>)}
      </List>
    </SimpleBar>
  </Box>
  );
};