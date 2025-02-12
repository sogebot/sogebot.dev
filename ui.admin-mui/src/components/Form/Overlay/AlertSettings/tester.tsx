import { ExpandMoreTwoTone, ShuffleOnTwoTone, ShuffleTwoTone } from '@mui/icons-material';
import { Accordion, AccordionDetails, AccordionSummary, Autocomplete, Box, Button, Divider, FormControl, IconButton, InputLabel, MenuItem, Select, Stack, TextField, Typography } from '@mui/material';
import { EmitData } from '@sogebot/backend/dest/database/entity/overlay';
import { generateUsername } from '@sogebot/backend/dest/helpers/generateUsername';
import match from 'autosuggest-highlight/match';
import parse from 'autosuggest-highlight/parse';
import axios from 'axios';
import { shuffle } from 'lodash';
import React from 'react';

import getAccessToken from '../../../../getAccessToken';
import { useAppSelector } from '../../../../hooks/useAppDispatch';
import { useTranslation } from '../../../../hooks/useTranslation';
import theme from '../../../../theme';
import { FormRewardInput } from '../../Input/Reward';

export const events = ['follow', 'cheer', 'tip', 'sub', 'resub', 'subcommunitygift', 'subgift', 'raid', 'custom', 'rewardredeem', 'promo'];

export const AlertsRegistryTesterAccordion: React.FC = () => {
  const [ open, setOpen ] = React.useState(true);
  const { translate } = useTranslation();
  const { configuration } = useAppSelector(state => state.loader);

  const [ event, setEvent ] = React.useState(translate('registry.alerts.event.follow'));
  const selectedEvent = React.useMemo(() => {
    const idx = events.map(o => translate('registry.alerts.event.' + o)).findIndex(o => o === event);
    return events[idx] as EmitData['event'];
  }, [event]);

  const usernameRef = React.useRef<HTMLInputElement>();
  const [ usernameRandom, setUsernameRandom ] = React.useState(true);

  const recipientRef = React.useRef<HTMLInputElement>();
  const [ recipientRandom, setRecipientRandom ] = React.useState(true);
  const haveRecipient = React.useMemo(() => {
    return ['rewardredeem', 'subgift', 'custom'].includes(selectedEvent);
  }, [ selectedEvent ]);

  const messageRef = React.useRef<HTMLInputElement>();
  const [ messageRandom, setMessageRandom ] = React.useState(true);
  const haveMessage = React.useMemo(() => {
    return ['tip', 'cheer', 'resub', 'rewardredeem', 'promo'].includes(selectedEvent);
  }, [ selectedEvent ]);

  const tierRef = React.useRef<HTMLInputElement>();
  const tiers = ['Prime', '1', '2', '3'] as const;
  const [ tierRandom, setTierRandom ] = React.useState(true);
  const haveTier = React.useMemo(() => {
    return ['subs', 'resub'].includes(selectedEvent);
  }, [ selectedEvent ]);

  const services = ['YouTube SuperChat', 'donatello', 'donationalerts', 'kofi', 'qiwi', 'streamelements', 'streamlabs', 'tiltify', 'tipeeestream'] as const;
  const serviceRef = React.useRef<HTMLInputElement>();
  const [ serviceRandom, setServiceRandom ] = React.useState(true);
  const haveService = React.useMemo(() => {
    return ['tip'].includes(selectedEvent);
  }, [ selectedEvent ]);

  const amountRef = React.useRef<HTMLInputElement>();
  const [ amountRandom, setAmountRandom ] = React.useState(true);
  const amountLabel = React.useMemo(() => {
    switch (selectedEvent) {
      case 'raid':
        return translate('registry.alerts.testDlg.amountOfViewers');
      case 'cheer':
      case 'custom':
        return translate('registry.alerts.testDlg.amountOfBits');
      case 'tip':
        return translate('registry.alerts.testDlg.amountOfTips');
      case 'subcommunitygift':
        return translate('registry.alerts.testDlg.amountOfGifts');
      case 'resub':
      case 'subgift':
        return translate('registry.alerts.testDlg.amountOfMonths');
      default:
        return null;
    }
  }, [ selectedEvent, translate ]);
  const haveAmount = React.useMemo(() => amountLabel !== null, [ amountLabel ]);
  const [ currency, setCurrency ] = React.useState(configuration.currency);

  const [ reward, setReward ] = React.useState<{
    id:   string | null,
    name: string | null,
  }>({
    id:   null,
    name: null,
  });

  const onSubmit = React.useCallback(() => {
    const messages = [
      'Lorem ipsum dolor sit amet, https://www.google.com',
      'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Etiam dictum tincidunt diam. Aliquam erat volutpat. Mauris tincidunt sem sed arcu. Etiam sapien elit, consequat eget, tristique non, venenatis quis, ante. Praesent id justo in neque elementum ultrices. Integer pellentesque quam vel velit. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Etiam commodo dui eget wisi. Cras pede libero, dapibus nec, pretium sit amet, tempor quis. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus.',
      'Lorem ipsum dolor sit amet, consectetuer adipiscing elit.',
      'This is some testing message :)',
      'Lorem ipsum dolor sit amet',
      '',
    ];

    const emit: EmitData = {
      eventId: null,
      amount:   amountRandom ? Math.floor(Math.random() * 1000) : Number(amountRef.current?.value ?? 5),
      rewardId: reward.id ?? undefined,
      name:
        selectedEvent === 'rewardredeem'
          ? reward.name || ''
          : (usernameRandom ? generateUsername() : usernameRef.current?.value ?? generateUsername()),
      tier:       tierRandom ? tiers[shuffle([0, 1, 2, 3])[0]] : (tierRef.current?.value ?? tiers[0]) as EmitData['tier'],
      service:    serviceRandom ? shuffle(services)[0] : serviceRef.current?.value ?? services[0],
      recipient:  recipientRandom ? generateUsername() : recipientRef.current?.value,
      currency:   currency,
      message:    messageRandom ? shuffle(messages)[0] : messageRef.current?.value ?? '',
      event:      selectedEvent,
      monthsName: '', // will be added at server
    };
    console.log('Testing', emit);
    axios.post('/api/registries/alerts/?_action=test', emit, {
      headers: {
        Authorization: `Bearer ${getAccessToken()}`
      }
    });
  }, [
    reward, selectedEvent, currency,
    amountRandom, usernameRandom, tierRandom, serviceRandom, recipientRandom, messageRandom,
  ]);

  return <Accordion expanded={open}>
    <AccordionSummary
      expandIcon={<ExpandMoreTwoTone />}
      onClick={() => setOpen(o => !o)}
      aria-controls="panel1a-content"
      id="panel1a-header"
    >
      <Typography>Alert Tester</Typography>
    </AccordionSummary>
    <AccordionDetails>
      <Autocomplete
        value={event}
        disableClearable
        onChange={(ev, value) => setEvent(value)}
        id="registry.alerts.testDlg.event"
        options={events.map(o => translate('registry.alerts.event.' + o))}
        renderInput={(params) => <TextField {...params} label={translate('registry.alerts.testDlg.event')} />}
        renderOption={(p, option, { inputValue }) => {
          const matches = match(option, inputValue, { insideWords: true });
          const parts = parse(option, matches);

          return (
            <li {...p}>
              <div>
                {parts.map((part, index) => (
                  <span
                    key={index}
                    style={{
                      backgroundColor: part.highlight ? theme.palette.primary.main : 'inherit',
                      color:           part.highlight ? 'black' : 'inherit',
                    }}
                  >
                    {part.text}
                  </span>
                ))}
              </div>
            </li>
          );
        }}
      />

      <Divider variant='middle'/>

      <Stack spacing={0.5}>
        {selectedEvent !== 'rewardredeem' && <Box sx={{
          display: 'flex', alignItems: 'center',
        }}>
          <IconButton onClick={() => setUsernameRandom(value => !value)}>
            {usernameRandom ? <ShuffleOnTwoTone/> : <ShuffleTwoTone/>}
          </IconButton>
          <TextField
            disabled={usernameRandom}
            inputRef={usernameRef}
            onClick = { () => usernameRef.current?.focus() }
            fullWidth
            variant="filled"
            label={selectedEvent === 'custom'
              ? translate('registry.alerts.testDlg.command')
              : translate('registry.alerts.testDlg.username')
            }
          />
        </Box>}

        {selectedEvent === 'rewardredeem' && <>
          <FormRewardInput value={reward.id} onChange={value => setReward(value)}/>
        </>}

        {haveRecipient && <Box sx={{
          display: 'flex', alignItems: 'center',
        }}>
          <IconButton onClick={() => setRecipientRandom(value => !value)}>
            {recipientRandom ? <ShuffleOnTwoTone/> : <ShuffleTwoTone/>}
          </IconButton>
          <TextField
            disabled={recipientRandom}
            inputRef={recipientRef}
            onClick = { () => recipientRef.current?.focus() }
            fullWidth
            variant="filled"
            label={translate('registry.alerts.testDlg.recipient')}
          />
        </Box>}

        {haveAmount && <Box sx={{
          display: 'flex', alignItems: 'center',
        }}>
          <IconButton onClick={() => setAmountRandom(value => !value)}>
            {amountRandom ? <ShuffleOnTwoTone/> : <ShuffleTwoTone/>}
          </IconButton>
          <TextField
            disabled={amountRandom}
            inputRef={amountRef}
            onClick = { () => amountRef.current?.focus() }
            fullWidth
            defaultValue={5}
            variant="filled"
            label={amountLabel}
          />
          {selectedEvent === 'tip' && <Autocomplete
            sx={{
              minWidth: '150px', pl: 0.5,
            }}
            disabled={amountRandom}
            value={currency}
            disableClearable
            onChange={(ev, value) => setCurrency(value)}
            renderInput={(params) => <TextField {...params} label={translate('menu.currency')} />}
            options={['USD', 'AUD', 'BGN', 'BRL', 'CAD', 'CHF', 'CNY', 'CZK', 'DKK', 'EUR', 'GBP', 'HKD', 'HRK', 'HUF', 'IDR', 'ILS', 'INR', 'ISK', 'JPY', 'KRW', 'MXN', 'MYR', 'NOK', 'NZD', 'PHP', 'PLN', 'RON', 'RUB', 'SEK', 'SGD', 'THB', 'TRY', 'ZAR']}
          />}
        </Box>}

        {haveTier && <Box sx={{
          display: 'flex', alignItems: 'center',
        }}>
          <IconButton onClick={() => setTierRandom(value => !value)}>
            {tierRandom ? <ShuffleOnTwoTone/> : <ShuffleTwoTone/>}
          </IconButton>
          <FormControl fullWidth variant="filled" disabled={tierRandom}>
            <InputLabel id="registry.alerts.font.align">{translate('registry.alerts.testDlg.tier')}</InputLabel>
            <Select
              MenuProps={{ PaperProps: { sx: { maxHeight: 200 } } }}
              label={translate('registry.alerts.testDlg.tier')}
              labelId="registry.alerts.testDlg.tier"
              inputRef={tierRef}
              defaultValue={tiers[0]}
            >
              {tiers.map(o => <MenuItem value={o} key={o}>{o}</MenuItem>)}
            </Select>
          </FormControl>
        </Box>}

        {haveService && <Box sx={{
          display: 'flex', alignItems: 'center',
        }}>
          <IconButton onClick={() => setServiceRandom(value => !value)}>
            {serviceRandom ? <ShuffleOnTwoTone/> : <ShuffleTwoTone/>}
          </IconButton>
          <FormControl fullWidth variant="filled" disabled={serviceRandom}>
            <InputLabel id="registry.alerts.font.align">{translate('registry.alerts.testDlg.service')}</InputLabel>
            <Select
              MenuProps={{ PaperProps: { sx: { maxHeight: 200 } } }}
              label={translate('registry.alerts.testDlg.service')}
              labelId="registry.alerts.testDlg.service"
              inputRef={serviceRef}
              defaultValue={services[0]}
            >
              {services.map(o => <MenuItem value={o} key={o}>{o}</MenuItem>)}
            </Select>
          </FormControl>
        </Box>}

        {haveMessage && <Box sx={{
          display: 'flex', alignItems: 'center',
        }}>
          <IconButton onClick={() => setMessageRandom(value => !value)}>
            {messageRandom ? <ShuffleOnTwoTone/> : <ShuffleTwoTone/>}
          </IconButton>
          <TextField
            multiline
            disabled={messageRandom}
            inputRef={messageRef}
            fullWidth
            variant="filled"
            label={translate('registry.alerts.testDlg.message')}
          />
        </Box>}

        <Button onClick={onSubmit}>Test</Button>
      </Stack>
    </AccordionDetails>
  </Accordion>;
};