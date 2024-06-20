import { CloseTwoTone } from '@mui/icons-material';
import { Badge, Box, IconButton, Link, Stack } from '@mui/material';
import { closeSnackbar, useSnackbar } from 'notistack';
import React, { useEffect } from 'react';
import { BrowserView, MobileView } from 'react-device-detect';
import reactStringReplace from 'react-string-replace';
import semver from 'semver';

import { getSocket } from '../../helpers/socket';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { useTranslation } from '../../hooks/useTranslation';
import sogebotLarge from '../../images/sogebot_large.png';
import sogebotSmall from '../../images/sogebot_small.png';
import { LinearProgressTimeout } from '../Progress/LinearProgressTimeout';

export const Logo: React.FC = () => {
  const { currentVersion, state, connectedToServer } = useAppSelector((s: any) => s.loader);
  const dispatch = useAppDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const { translate } = useTranslation();

  useEffect(() => {
    if (!state || !connectedToServer) {
      return;
    }

    getSocket('/').emit('version', async (version: string) => {
      try {
        const { response } = await new Promise<{ response: Record<string, any> }>((resolve) => {
          const request = new XMLHttpRequest();
          request.open('GET', 'https://api.github.com/repos/sogehige/sogebot/releases/latest', true);

          request.onload = function () {
            if (!(this.status >= 200 && this.status < 400)) {
              console.error('Error getting version from git', this.status, this.response);
            }
            resolve({ response: JSON.parse(this.response) });
          };
          request.onerror = function () {
            console.error('Connection error to github');
            resolve({ response: {} });
          };

          request.send();
        });
        const botVersion = version.trim().split('-')[0];
        const gitVersion = (response.tag_name as string);
        console.log('botVersion', botVersion, 'gitVersion', gitVersion);

        if (semver.lt(botVersion, gitVersion)) {
          let message = reactStringReplace(translate('errors.new_bot_version_available_at'), '{version}', () =>  <strong>&nbsp;{gitVersion}&nbsp;</strong>);
          message = reactStringReplace(message, '{link}', () => <Link sx={{
            pl:                  0.5,
            display:             'inline-block',
            color:               'white !important',
            textDecorationColor: 'white !important',
            fontWeight:          'bold',
          }}
          target="_blank" rel="noreferrer"
          href={`https://github.com/sogehige/sogeBot/releases/tag/${gitVersion}`}>GitHub</Link>);
          const notif = enqueueSnackbar(<Stack>
            <div>{message}</div>
            <LinearProgressTimeout
              onClose={() => closeSnackbar(notif)}
              sx={{
                position: 'absolute',
                width: '100%',
                bottom: 0,
                left: 0,
              }} timeout={10000} />
          </Stack>,
          {
            action: <IconButton color='light' onClick={() => closeSnackbar(notif)} sx={{ color: 'white' }}>
              <CloseTwoTone/>
            </IconButton>,
            variant:          'info',
            autoHideDuration: null,
          });
        }
      } catch (e) {
        return;
      }
    });
  }, [state, connectedToServer, dispatch]);

  return (
    <>
      <Box>
        <Badge
          badgeContent={currentVersion}
          color="primary"
          invisible={!currentVersion}
          anchorOrigin={{
            vertical:   'bottom',
            horizontal: 'right',
          }}>
          <a href="https://sogebot.xyz" target={'_blank'} rel="noreferrer">
            <MobileView>
              <img src={sogebotSmall} width={40} height={25} alt="sogeBot Logo" />
            </MobileView>
            <BrowserView>
              <img src={sogebotLarge} width={190} height={25} alt="sogeBot Logo" />
            </BrowserView>
          </a>
        </Badge>
      </Box></>
  );
};