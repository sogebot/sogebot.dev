import { Badge, Box } from '@mui/material';
import React, { useEffect } from 'react';
import { BrowserView, MobileView } from 'react-device-detect';

import { getSocket } from '../../helpers/socket';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import sogebotLarge from '../../images/sogebot_large.png';
import sogebotSmall from '../../images/sogebot_small.png';
import { setCurrentVersion, setNextVersion } from '../../store/loaderSlice';

export const Logo: React.FC = () => {
  const { currentVersion, state, connectedToServer } = useAppSelector((s: any) => s.loader);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!state || !connectedToServer) {
      return;
    }

    getSocket('/', true).emit('version', async (version: string) => {
      dispatch(setCurrentVersion(version));
      try {
        const { response } = await new Promise<{ response: Record<string, any>}>((resolve) => {
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
        const botVersion = version.replace('-SNAPSHOT', '').split('.').map(o => Number(o));
        const gitVersion = (response.tag_name as string).split('.').map(o => Number(o));
        console.debug({
          botVersion, gitVersion,
        });

        let isNewer = false;
        for (let index = 0; index < botVersion.length; index++) {
          if (botVersion[index] < gitVersion[index]) {
            isNewer = true;
            break;
          } else if (botVersion[index] === gitVersion[index]) {
            continue;
          } else {
            isNewer = false;
            break;
          }
        }

        if (isNewer) {
          dispatch(setNextVersion(gitVersion.join('.')));
        } else {
          dispatch(setNextVersion(null));
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