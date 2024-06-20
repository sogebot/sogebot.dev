import { Alert, CircularProgress, Divider, Typography } from '@mui/material';
import { Stack } from '@mui/system';
import axios from 'axios';
import { useAtomValue } from 'jotai';
import camelCase from 'lodash/camelCase';
import React, { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useLocalstorageState } from 'rooks';

import { useSettings } from './useSettings';
import { loggedUserAtom } from '../atoms';
import { Commands } from '../classes/Commands';

export const useBotCommandsExample = (item: Commands | null) => {
  const user = useAtomValue(loggedUserAtom);
  const location = useLocation();
  const [server] = useLocalstorageState('server', 'https://demobot.sogebot.xyz');

  const [ exampleData, setExampleData ] = useState<(string|{ if?: string, message: string, replace: { [x:string]: string } })[][]>([]);
  const [ parsed, setParsed ] = useState<Record<string, string>>({});
  const [ settings, setSettings ] = useState<Record<string, any>>({});

  const { loading, refresh, ui, settings: settings2 } = useSettings(!item ? null : `/${item.type.toLowerCase()}/${item.name.toLowerCase()}`);

  useEffect(() => {
    refresh();
  }, [location]);

  useEffect(() => {
    console.log({ item, ui, settings2 });
    if (!item || !ui || !settings2) {
      setExampleData([]);
      return;
    }

    const strippedCamelCaseCommand = camelCase(item.defaultValue.replace('!', ''));

    if (ui[strippedCamelCaseCommand]) {
      setExampleData(ui[strippedCamelCaseCommand]);
    }

    // select all command related settings
    const commandSettings: Record<string, any> = {};
    for (const key of Object.keys(settings2)) {
      if (key.startsWith(item.defaultValue)) {
        commandSettings[key] = settings2[key];
      }
    }
    setSettings(commandSettings);
  }, [ item, ui, settings2 ]);

  const generateExamples = useCallback((data: typeof exampleData[number], idx: number) => {
    if (!item && data.length > 0) {
      return <></>;
    }

    return (<>
      {idx > 0 && <Divider sx={{
        mx: 5, my: 1,
      }}/>}
      <div>
        {
          data.map((value) => {
            if (typeof value === 'string') {
              // replace command with current value
              if (item) {
                value = value.replace(item.defaultValue, item.command);
              }

              if (value.startsWith('?')) {
                value = value.replace('?', '');
                return <Alert key={value} variant="filled" color="info" icon={false} sx={{
                  mb: 1, width: 'fit-content',
                }}>{value}</Alert>;
              } else if (value.startsWith('+')) {
                value = value.replace('+', '');
                return <Stack key={value} direction="row" spacing={1}>
                  <Typography color="orange">{user?.display_name}:</Typography>
                  <Typography>{value}</Typography>
                </Stack>;
              } else {
                return 'unknown';
              }
            } else {
              let message = value.message.replace(/[\\+-]/g, '');
              // replace command with current value
              if (item) {
                message = message.replace(item.defaultValue, item.command);
              }

              // first we need to replace message with settings
              for (const match of message.matchAll(/\{(\w+)}/g)) {
                const attribute = match[1];

                // search attribute in settings
                const key = Object.keys(settings).find(k => k.includes(attribute));
                if (key) {
                  message = message.replaceAll(match[0], settings[key][0]);
                }
              }

              for (const [replace, val] of Object.entries(value.replace)) {
                message = message.replaceAll(replace, val);
              }

              if (!parsed[message]) {
                // parse messages
                if (user) {
                  axios.post(`${server}/api/core/parse`,
                    {
                      message,
                      user: {
                        id: user.id, username: user.login,
                      },
                    })
                    .then((response) => {
                      setParsed(d => ({
                        ...d, [message]: response.data.data,
                      }));
                    });
                }
              }
              const messageElement = parsed[message]
                ? <Typography>{parsed[message]}</Typography>
                : <CircularProgress size={20} />;

              let showMessage = true;
              const vif = value.if;
              if (vif) {
                const key = Object.keys(settings).find(k => k.includes(vif));
                if (key) {
                  showMessage = !!settings[key][0];
                }
              }

              const username = value.message.startsWith('+')
                ? <Typography color="orange">{user?.display_name}:</Typography>
                : <Typography color="tomato">bot:</Typography>;
              return showMessage && <Stack key={value.message} direction="row" spacing={1}>
                {username}
                {messageElement}
              </Stack>;
            }
          })
        }
      </div>
    </>);
  }, [item, settings, parsed, user, server]);

  const examples = <>
    { item && exampleData.length > 0 && <Divider sx={{ pt: 3 }}>Usage examples</Divider> }
    { item && exampleData.map((data, idx) => generateExamples(data, idx))}
  </>;

  return {
    loading, examples,
  };
};
