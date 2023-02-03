import {
  Alert,
  CircularProgress, Divider, Typography,
} from '@mui/material';
import { Stack } from '@mui/system';
import axios from 'axios';
import camelCase from 'lodash/camelCase';
import React, {
  useCallback, useEffect, useState,
} from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { useSessionstorageState } from 'rooks';

import { Commands } from '../classes/Commands';
import getAccessToken from '../getAccessToken';
import { getSocket } from '../helpers/socket';

export const useBotCommandsExample = (item: Commands | null) => {
  const { user } = useSelector((state: any) => state.user);
  const location = useLocation();
  const [server] = useSessionstorageState('server', 'https://demobot.sogebot.xyz');

  const [ loading, setLoading ] = useState(true);
  const [ exampleData, setExampleData ] = useState<(string|{if?: string, message: string, replace: { [x:string]: string }})[][]>([]);
  const [ settings, setSettings ] = useState<Record<string, any>>({});
  const [ parsed, setParsed ] = useState<Record<string, string>>({});

  useEffect(() => {
    setLoading(true);
  }, [location]);

  useEffect(() => {
    if (!item) {
      setExampleData([]);
      return;
    }
    getSocket(`/${item.type.toLowerCase()}/${item.name.toLowerCase()}` as any)
      .emit('settings', (err: any, data: { [x: string]: any[]; }, ui: { [x: string]: any[]; }) => {
        if (err) {
          console.error(err);
          return;
        }

        const strippedCamelCaseCommand = camelCase(item.defaultValue.replace('!', ''));

        if (ui[strippedCamelCaseCommand]) {
          setExampleData(ui[strippedCamelCaseCommand]);
        }

        // select all command related settings
        const commandSettings: Record<string, any> = {};
        for (const key of Object.keys(data)) {
          if (key.startsWith(item.defaultValue)) {
            commandSettings[key] = data[key];
          }
        }
        setSettings(commandSettings);
        setLoading(false);
      });
  }, [ item ]);

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
                  <Typography color="orange">{user.display_name}:</Typography>
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
                axios.post(`${server}/api/core/parse`,
                  {
                    message,
                    user: {
                      id: user.id, username: user.login,
                    },
                  },
                  { headers: { authorization: `Bearer ${getAccessToken()}` } })
                  .then((response) => {
                    setParsed(d => ({
                      ...d, [message]: response.data.data,
                    }));
                  });
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
                ? <Typography color="orange">{user.display_name}:</Typography>
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
