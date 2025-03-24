import { Chat } from '@entity/overlay';
import { mdiTwitch, mdiYoutube } from '@mdi/js';
import Icon from '@mdi/react';
import { Box, Button, Divider, FormControl, FormControlLabel, InputAdornment, InputLabel, MenuItem, Select, Stack, Switch, TextField, Typography } from '@mui/material';
import gsap from 'gsap';
import Jabber from 'jabber';
import { isEqual } from 'lodash';
import { matchIsValidColor, MuiColorInput } from 'mui-color-input';
import { nanoid } from 'nanoid';
import React from 'react';
import { usePreviousImmediate } from 'rooks';

import { DAY, HOUR, MINUTE, SECOND } from '../../../constants';
import { timestampToObject } from '../../../helpers/getTime';
import { useAppDispatch, useAppSelector } from '../../../hooks/useAppDispatch';
import { chatAddMessage, chatRemoveMessageById } from '../../../store/overlaySlice';
import { AccordionFont } from '../../Accordion/Font';

const jabber = new Jabber();

type Props = {
  model:    Chat;
  onUpdate: (value: Chat) => void;
};

export const ChatSettings: React.FC<Props> = ({ model, onUpdate }) => {
  const [ open, setOpen ] = React.useState('');
  const lang = useAppSelector(state => state.loader.configuration.lang );
  const dispatch = useAppDispatch();

  React.useEffect(() => {
    setTime(timestampToObject(model.hideMessageAfter));
  }, []);

  const [ time, setTime ] = React.useState({
    days: 0, hours: 0, minutes: 10, seconds: 0,
  });
  const prevTime = usePreviousImmediate(time);

  React.useEffect(() => {
    if (prevTime && !isEqual(time, prevTime)) {
      onUpdate({
        ...model,
        hideMessageAfter: time.days * DAY + time.hours * HOUR + time.minutes * MINUTE + time.seconds * SECOND,
      });
    }
  }, [time, prevTime, model]);

  const moveNicoNico = React.useCallback((elementId: string) => {
    const element = document.getElementById(`nico-${elementId}`);
    if (element) {
      gsap.to(element, {
        ease:       'none',
        left:       '-100%',
        marginLeft: '0',
        duration:   Math.max(5, Math.floor(Math.random() * 15)),
        onComplete: () => {
          dispatch(chatRemoveMessageById(elementId));
        },
      });
    } else {
      setTimeout(() => moveNicoNico(elementId), 1000);
    }
  }, []);

  const test = React.useCallback(async () => {
    // show test messages
    const userName = jabber.createWord(3 + Math.ceil(Math.random() * 20)).toLowerCase();
    const longMessage = Math.random() <= 0.1;
    const emote = Math.random() <= 0.5
      ? 'https://cdn.frankerfacez.com/emote/120593/4'
      : 'https://static-cdn.jtvnw.net/emoticons/v2/25/default/dark/3.0';
    const emotes = Math.random() <= 0.5
      ? `<span class="simpleChatImage"><img src='${emote}' class="emote" alt="Kappa" title="Kappa"/></span>`.repeat(Math.round(Math.random() * 5))
      : '';
    const id = nanoid();

    let message = jabber.createParagraph(1 + Math.ceil(Math.random() * (longMessage ? 3 : 10))) + emotes;
    if (lang === 'cs') {
      message = Math.random() <= 0.3 ? 'Příliš žluťoučký kůň úpěl ďábelské ódy.' : message;
    }
    if (lang === 'ru') {
      message = Math.random() <= 0.3 ? 'Эх, чужак, общий съём цен шляп (юфть) – вдрызг!' : message;
    }

    const service = Math.random() <= 0.5 ? 'twitch' : 'youtube';
    dispatch(chatAddMessage({
      id,
      timestamp:   Date.now(),
      userName,
      service,
      displayName: Math.random() <= 0.5 ? userName : jabber.createWord(3 + Math.ceil(Math.random() * 20)).toLowerCase(),
      message,
      badges:     (service === 'twitch'
        ? Math.random() <= 0.3 ? [{ url: 'https://static-cdn.jtvnw.net/badges/v1/3267646d-33f0-4b17-b3df-f923a41db1d0/3' }, { url: 'https://static-cdn.jtvnw.net/badges/v1/fc46b10c-5b45-43fd-81ad-d5cb0de6d2f4/3' }] : []
        : {
          moderator: Math.random() <= 0.3,
          subscriber: Math.random() <= 0.3,
          owner: Math.random() <= 0.3,
        }) as any,
    }));

    if (model.type === 'niconico') {
      moveNicoNico(id);
    }
  }, [dispatch, model]);

  const handleTimeChange = <T extends keyof typeof time>(input: typeof time, key: T, value: string) => {
    let numberVal = Number(value);

    if (key === 'seconds' && numberVal < 0) {
      if (input.minutes > 0 || input.hours > 0 || input.days > 0) {
        const updatedInput = {
          ...input, [key]: 59,
        };
        handleTimeChange(updatedInput, 'minutes', String(input.minutes - 1));
        return;
      } else {
        numberVal = 0;
      }
    }

    if (key === 'minutes' && numberVal < 0) {
      if (input.hours > 0 || input.days > 0) {
        const updatedInput = {
          ...input, [key]: 59,
        };
        handleTimeChange(updatedInput, 'hours', String(input.hours - 1));
        return;
      } else {
        numberVal = 0;
      }
    }

    if (key === 'hours' && numberVal < 0) {
      if (input.days > 0) {
        const updatedInput = {
          ...input, [key]: 23,
        };
        handleTimeChange(updatedInput, 'days', String(input.days - 1));
        return;
      } else {
        numberVal = 0;
      }
    }

    if ((key === 'seconds' || key === 'minutes') && numberVal >= 60) {
      const updatedInput = {
        ...input, [key]: 0,
      };
      if(key === 'seconds') {
        handleTimeChange(updatedInput, 'minutes', String(input.minutes + 1));
      } else {
        handleTimeChange(updatedInput, 'hours', String(input.hours + 1));
      }
      return;
    }

    if (key === 'hours' && numberVal >= 24) {
      const updatedInput = {
        ...input, [key]: 0,
      };
      handleTimeChange(updatedInput, 'days', String(input.days + 1));
      return;

    }

    if (numberVal < 0) {
      numberVal = 0;
    }

    setTime({
      ...input, [key]: numberVal,
    });
  };

  React.useEffect(() => {
    test();
    test();
    test();
    test();
    test();
  }, []);

  return <>
    <Button sx={{ py: 1.5 }} fullWidth onClick={test} variant='contained'>Test</Button>
    <Divider variant='middle'/>
    <Stack spacing={0.5}>
      <FormControl fullWidth variant="filled" >
        <InputLabel id="type-select-label">Type</InputLabel>
        <Select
          MenuProps={{ PaperProps: { sx: { maxHeight: 200 } } }}
          label="Type"
          labelId="type-select-label"
          value={model.type}
          onChange={(ev) => onUpdate({
            ...model, type: ev.target.value as 'vertical',
          })}
        >
          <MenuItem value="vertical" key="vertical">vertical</MenuItem>
          <MenuItem value="horizontal" key="horizontal">horizontal</MenuItem>
          <MenuItem value="niconico" key="niconico">niconico</MenuItem>
        </Select>
      </FormControl>

      {model.type !== 'niconico' && <Stack direction='row'>
        <TextField
          fullWidth
          variant="filled"
          type="number"
          value={time.days}
          required
          label={'Days'}
          onChange={(event) => handleTimeChange(time, 'days', event.target.value)}
          sx={{
            '& .MuiInputBase-root': {
              borderRadius: 0, borderLeftRightRadius: '4px',
            },
          }}
        />
        <TextField
          fullWidth
          variant="filled"
          type="number"
          value={time.hours}
          required
          label={'Hours'}
          onChange={(event) => handleTimeChange(time, 'hours', event.target.value)}
          sx={{ '& .MuiInputBase-root': { borderRadius: 0 } }}
        />
        <TextField
          fullWidth
          variant="filled"
          type="number"
          value={time.minutes}
          required
          label={'Minutes'}
          onChange={(event) => handleTimeChange(time, 'minutes', event.target.value)}
          sx={{ '& .MuiInputBase-root': { borderRadius: 0 } }}
        />
        <TextField
          fullWidth
          variant="filled"
          type="number"
          value={time.seconds}
          required
          label={'Seconds'}
          onChange={(event) => handleTimeChange(time, 'seconds', event.target.value)}
          sx={{
            '& .MuiInputBase-root': {
              borderRadius: 0, borderTopRightRadius: '4px',
            },
          }}
        />
      </Stack>}

      <TextField
        fullWidth
        variant="filled"
        value={model.customEmoteSize}
        inputProps={{ min: 1 }}
        type="number"
        label={'Custom emote size'}
        InputProps={{
          endAdornment: <>
            <InputAdornment position='end'>px</InputAdornment>
            <InputAdornment position='end'>
              <Switch checked={model.useCustomEmoteSize} onChange={(_, checked) => onUpdate({
                ...model, useCustomEmoteSize: checked,
              })}/>
            </InputAdornment>
          </>,
        }}
        onChange={(ev) => {
          if (!isNaN(Number(ev.currentTarget.value))) {
            onUpdate({
              ...model, customEmoteSize: Number(ev.currentTarget.value),
            });
          }
        }}
      />

      <TextField
        fullWidth
        variant="filled"
        value={model.customServiceIconSize}
        inputProps={{ min: 1 }}
        type="number"
        label={'Custom badge size'}
        InputProps={{
          endAdornment: <>
            <InputAdornment position='end'>px</InputAdornment>
            <InputAdornment position='end'>
              <Switch checked={model.useCustomServiceIconSize} onChange={(_, checked) => onUpdate({
                ...model, useCustomServiceIconSize: checked,
              })}/>
            </InputAdornment>
          </>,
        }}
        onChange={(ev) => {
          if (!isNaN(Number(ev.currentTarget.value))) {
            onUpdate({
              ...model, customServiceIconSize: Number(ev.currentTarget.value),
            });
          }
        }}
      />

      <TextField
        fullWidth
        variant="filled"
        value={model.customBadgeSize}
        inputProps={{ min: 1 }}
        type="number"
        label={'Custom badge size'}
        InputProps={{
          endAdornment: <>
            <InputAdornment position='end'>px</InputAdornment>
            <InputAdornment position='end'>
              <Switch checked={model.useCustomBadgeSize} onChange={(_, checked) => onUpdate({
                ...model, useCustomBadgeSize: checked,
              })}/>
            </InputAdornment>
          </>,
        }}
        onChange={(ev) => {
          if (!isNaN(Number(ev.currentTarget.value))) {
            onUpdate({
              ...model, customBadgeSize: Number(ev.currentTarget.value),
            });
          }
        }}
      />

      <Box sx={{
        p: 1, px: 2,
      }}>
        <FormControlLabel sx={{
          width: '100%', alignItems: 'self-start', pt: 1,
        }} control={<Switch checked={model.showServiceIcons} onChange={(_, checked) => onUpdate({
          ...model, showServiceIcons: checked,
        })} />} label={<>
          <Typography>Show service icon
            <Box sx={{ position: 'relative', top: '3px', display: 'inline', ml: 1 }}>
              <Icon path={mdiTwitch} size={0.75} />
              <Icon path={mdiYoutube} size={0.75} />
            </Box>
          </Typography>
          <Typography variant='body2' sx={{ fontSize: '12px' }}>{model.showServiceIcons
            ? 'Service icons will be shown.'
            : 'Service icons won\'t be shown.'
          }</Typography>
        </>}/>

        <FormControlLabel sx={{
          width: '100%', alignItems: 'self-start', pt: 1,
        }} control={<Switch checked={model.showCommandMessages} onChange={(_, checked) => onUpdate({
          ...model, showCommandMessages: checked,
        })} />} label={<>
          <Typography>Show !command messages</Typography>
          <Typography variant='body2' sx={{ fontSize: '12px' }}>{model.showCommandMessages
            ? 'Command messages starting with ! will be shown.'
            : 'Command messages starting with ! won\'t be shown.'
          }</Typography>
        </>}/>

        <FormControlLabel sx={{
          width: '100%', alignItems: 'self-start',
        }} control={<Switch checked={model.showTimestamp} onChange={(_, checked) => onUpdate({
          ...model, showTimestamp: checked,
        })} />} label={<>
          <Typography>Show timestamps</Typography>
          <Typography variant='body2' sx={{ fontSize: '12px' }}>{model.showTimestamp
            ? 'Message will contain timestamp.'
            : 'Timestamp won\'t be visible.'
          }</Typography>
        </>}/>

        <FormControlLabel sx={{
          width: '100%', alignItems: 'self-start', pt: 1,
        }} control={<Switch checked={model.showBadges} onChange={(_, checked) => onUpdate({
          ...model, showBadges: checked,
        })} />} label={<>
          <Typography>Show badges</Typography>
          <Typography variant='body2' sx={{ fontSize: '12px' }}>{model.showBadges
            ? 'Message will contain badges.'
            : 'Badges won\'t be visible.'
          }</Typography>
        </>}/>

        {model.type !== 'niconico' && <FormControlLabel sx={{
          width: '100%', pt: 1,
        }} control={<Switch checked={model.reverseOrder} onChange={(_, checked) => onUpdate({
          ...model, reverseOrder: checked,
        })} />} label='Reverse flow of chat'/>}

      </Box>
      <AccordionFont
        alwaysShowLabelDetails
        disableExample
        label='Username'
        model={model.usernameFont ?? model.font}
        open={open}
        isEditable={model.usernameFont !== null}
        onOpenChange={(val) => setOpen(val)}
        onChange={(val) => {
          onUpdate({
            ...model, usernameFont: val,
          });
        }}
        customLabelDetails={!model.usernameFont
          ? <span>not used</span>
          : <strong>{model.usernameFont.family} {'size' in model.usernameFont && `${model.usernameFont.size}px`}</strong>
        }
        prepend={<>
          <Box sx={{ pb: 1 }}>
            <FormControlLabel sx={{
              width: '100%', alignItems: 'self-start', pt: 1,
            }} control={<Switch checked={model.useGeneratedColors} onChange={(_, checked) => onUpdate({
              ...model, useGeneratedColors: checked,
            })} />} label={<>
              <Typography>Use generated user name colors</Typography>
              <Typography variant='body2' sx={{ fontSize: '12px' }}>{model.useGeneratedColors
                ? <>User names will have generated colors.</>
                : <>User names will have user-defined color.<br/><small>Note: we are slightly altering color lightness to have better visibility.</small></>
              }</Typography>
            </>}/>

            { model.usernameFont !== null && <FormControlLabel sx={{
              width: '100%', alignItems: 'self-start', pt: 1,
            }} control={<Switch checked={model.useCustomUsernameColor} onChange={(_, checked) => onUpdate({
              ...model, useCustomUsernameColor: checked,
            })} />} label={<>
              <Typography>Use defined color</Typography>
              <Typography variant='body2' sx={{ fontSize: '12px' }}>{model.useCustomUsernameColor
                ? <>User names will have overlay-defined single color.</>
                : <>User names won't have  overlay-defined single color.</>
              }</Typography>
            </>}/>}
          </Box>

          <Stack direction='row' sx={{ py: 1 }}>
            <Button variant={model.usernameFont === null ? 'contained' : undefined} fullWidth onClick={() => {
              onUpdate({
                ...model, usernameFont: null,
              });
            }}>Message font</Button>

            <Button variant={model.usernameFont !== null ? 'contained' : undefined} fullWidth onClick={() => {
              onUpdate({
                ...model, usernameFont: model.font,
              });
            }}>Custom</Button>
          </Stack>
        </>}
      />
      <AccordionFont
        alwaysShowLabelDetails
        disableExample
        label='Separator'
        model={model.separatorFont ?? model.font}
        open={open}
        isEditable={model.separatorFont !== null}
        onOpenChange={(val) => setOpen(val)}
        onChange={(val) => {
          onUpdate({
            ...model, separatorFont: val,
          });
        }}
        customLabelDetails={!model.separatorFont
          ? <span>not used</span>
          : <strong>{model.separatorFont.family} {'size' in model.separatorFont && `${model.separatorFont.size}px`}</strong>
        }
        prepend={<>
          <TextField
            fullWidth
            variant="filled"
            value={model.separator}
            label={'Separator between user name and message'}
            onChange={(ev) => {
              onUpdate({
                ...model, separator: String(ev.currentTarget.value),
              });
            }}
          />
          <Stack direction='row' sx={{ py: 1 }}>
            <Button variant={model.separatorFont === null ? 'contained' : undefined} fullWidth onClick={() => {
              onUpdate({
                ...model, separatorFont: null,
              });
            }}>Username font</Button>

            <Button variant={model.separatorFont !== null ? 'contained' : undefined} fullWidth onClick={() => {
              onUpdate({
                ...model, separatorFont: model.usernameFont ?? model.font,
              });
            }}>Custom</Button>
          </Stack>
        </>}
      />
      <AccordionFont
        disableExample
        label='Message'
        model={model.font}
        open={open}
        onOpenChange={(val) => setOpen(val)}
        onChange={(val) => {
          onUpdate({
            ...model, font: val,
          });
        }}
        prepend={<>
          {model.type !== 'niconico' && <TextField
            fullWidth
            variant="filled"
            value={model.customSpaceBetweenMessages}
            inputProps={{ min: 1 }}
            type="number"
            label={'Custom space between messages'}
            InputProps={{
              endAdornment: <>
                <InputAdornment position='end'>px</InputAdornment>
                <InputAdornment position='end'>
                  <Switch checked={model.useCustomSpaceBetweenMessages} onChange={(_, checked) => onUpdate({
                    ...model, useCustomSpaceBetweenMessages: checked,
                  })}/>
                </InputAdornment>
              </>,
            }}
            onChange={(ev) => {
              if (!isNaN(Number(ev.currentTarget.value))) {
                onUpdate({
                  ...model, customSpaceBetweenMessages: Number(ev.currentTarget.value),
                });
              }
            }}
          />}

          {model.type !== 'niconico' && <TextField
            fullWidth
            variant="filled"
            value={model.customLineHeight}
            inputProps={{ min: 1 }}
            type="number"
            label={'Custom line height'}
            InputProps={{
              endAdornment: <>
                <InputAdornment position='end'>px</InputAdornment>
                <InputAdornment position='end'>
                  <Switch checked={model.useCustomLineHeight} onChange={(_, checked) => onUpdate({
                    ...model, useCustomLineHeight: checked,
                  })}/>
                </InputAdornment></>,
            }}
            onChange={(ev) => {
              if (!isNaN(Number(ev.currentTarget.value))) {
                onUpdate({
                  ...model, customLineHeight: Number(ev.currentTarget.value),
                });
              }
            }}
          />}

          {model.type !== 'niconico' && <TextField
            fullWidth
            variant="filled"
            value={model.messagePadding}
            inputProps={{ min: 0 }}
            type="number"
            label={'Message inner padding'}
            onChange={(ev) => {
              if (!isNaN(Number(ev.currentTarget.value))) {
                onUpdate({
                  ...model, messagePadding: Number(ev.currentTarget.value),
                });
              }
            }}
          />}

          <MuiColorInput
            label="Background color"
            fullWidth
            format="hex8"
            value={matchIsValidColor(model.messageBackgroundColor ?? '') ? model.messageBackgroundColor! : '#ffffffff'}
            onChange={(value) => {
              onUpdate({
                ...model, messageBackgroundColor: matchIsValidColor(value) ? value : '#ffffffff',
              });
            }} />
        </>}/>
    </Stack>
  </>;
};