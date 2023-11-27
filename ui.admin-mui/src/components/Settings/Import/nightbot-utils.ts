import { defaultPermissions } from '@sogebot/backend/src/helpers/permissions/defaultPermissions';
import axios, { AxiosRequestConfig } from 'axios';
import { enqueueSnackbar } from 'notistack';

import getAccessToken from '../../../getAccessToken';
import { getSocket } from '../../../helpers/socket';

type Track = {
  providerId: string;
  provider:   string;
  duration:   number;
  title:      string;
  artist:     string;
  url:        string;
};

type PlaylistItem = {
  track:     Track;
  _id:       string;
  createdAt: string; // timestamp date
  updatedAt: string; // timestamp date
};

type PlaylistResponse = {
  status:   number;
  _sort:    { date: 'asc' | 'desc' };
  _limit:   number;
  _offset:  number;
  _total:   number;
  playlist: PlaylistItem[];
};

type UserLevel =
  | 'admin'
  | 'owner'
  | 'moderator'
  | 'twitch_vip'
  | 'regular'
  | 'subscriber'
  | 'everyone';

type CustomCommand = {
  _id:       string;
  createdAt: string; // timestamp date
  updatedAt: string; // timestamp date
  name:      string;
  message:   string;
  coolDown:  number;
  count:     number;
  userLevel: UserLevel;
};

type CustomCommandsResponse = {
  _total:   number;
  status:   number;
  commands: CustomCommand[];
};

const permissions = new Map([
  ['admin', defaultPermissions.CASTERS],
  ['owner', defaultPermissions.CASTERS],
  ['moderator', defaultPermissions.MODERATORS],
  ['twitch_vip', defaultPermissions.VIP],
  ['regular', defaultPermissions.SUBSCRIBERS],
  ['subscriber', defaultPermissions.SUBSCRIBERS],
  ['everyone', defaultPermissions.VIEWERS],
]);

export const sleep = async (ms: number) => {
  await new Promise((resolve) => setTimeout(resolve, ms));
};

const fetchWithRetries = async (
  url: string,
  options: AxiosRequestConfig,
  retries = 3,
  delaySeconds = 60
) => {
  const delay = delaySeconds * 10e3; // 60_000ms
  while (retries-- > 0) {
    try {
      const response = await axios.get(url, options);
      return response.data;
    } catch (error: any) {
      console.info(`Retrying after ${delaySeconds} seconds.`);
      await sleep(delay);
    }
  }
};

const fetchPlaylistPage = async (
  offset: number,
  accessToken: string | null
): Promise<PlaylistResponse> => {
  const url = 'https://api.nightbot.tv/1/song_requests/playlist';
  try {
    const page = fetchWithRetries(url, {
      params: {
        limit:  100,
        offset: offset,
      },
      headers: { Authorization: 'Bearer ' + accessToken },
    });
    return page;
  } catch {
    console.error('Error fetching commands after multiple retries.');
    enqueueSnackbar('Remote server error.', { variant: 'error' });
    throw new Error('Failed to fetch commands after multiple retries.');
  }
};

const fetchTracks = async (
  accessToken: string | null,
  tracks: Track[] = [],
  offset = 0
): Promise<Track[]> => {
  try {
    const page = await fetchPlaylistPage(offset, accessToken);
    const mergedTracks = tracks.concat(page.playlist.map((t) => t.track));
    return mergedTracks.length < page._total
      ? await fetchTracks(accessToken, mergedTracks, offset + 100)
      : mergedTracks;
  } catch {
    console.error('Error fetching playlist.');
    enqueueSnackbar('Remote server error.', { variant: 'error' });
    throw new Error('Failed to fetch playlist.');
  }
};

const postTrack = async (track: Track) => {
  await new Promise((resolve, reject) => {
    getSocket('/systems/songs').emit(
      'import.video',
      {
        playlist:  track.providerId,
        forcedTag: 'nightbot-import',
      },
      (err) => {
        if (err) {
          reject(err);
        } else {
          resolve('resolved');
        }
      }
    );
  });
};

export const importPlaylist = async (accessToken: string | null) => {
  const tracks = await fetchTracks(accessToken);
  const ytVideos = tracks.filter((track) => track.provider === 'youtube');
  let failCount = 0;
  for (const track of ytVideos) {
    try {
      await postTrack(track);
    } catch {
      console.error('error: ', track.url);
      failCount++;
    }
  }
  if (failCount > 0) {
    enqueueSnackbar(`${failCount} videos failed to import.`, {
      variant: 'info',
    });
  }
  enqueueSnackbar('Playlist import completed.', { variant: 'success' });
};

const fetchCustomCommandsPage = async (
  accessToken: string | null
): Promise<CustomCommandsResponse> => {
  const url = 'https://api.nightbot.tv/1/commands';
  try {
    const page = fetchWithRetries(url, {
      headers: { Authorization: 'Bearer ' + accessToken },
    });
    return page;
  } catch {
    console.error('Error fetching commands after multiple retries.');
    enqueueSnackbar('Remote server error.', { variant: 'error' });
    throw new Error('Failed to fetch commands after multiple retries.');
  }
};

export const fetchCustomCommands = async (
  accessToken: string | null
): Promise<CustomCommand[]> => {
  try {
    const page = await fetchCustomCommandsPage(accessToken);
    return page.commands;
  } catch (error: any) {
    console.error('Error fetching commands.');
    enqueueSnackbar('Remote server error.', { variant: 'error' });
    throw new Error('Failed to fetch commands.');
  }
};

const postKeyword = async (keyword: CustomCommand) => {
  const convertedKeyword = {
    keyword:   keyword.name,
    enabled:   true,
    group:     'nightbot-import',
    responses: [
      {
        order:          0,
        response:       keyword.message,
        stopIfExecuted: false,
        filter:         '',
        permission:     permissions.get(keyword.userLevel),
      },
    ],
  };
  try {
    await axios.post(
      `${JSON.parse(localStorage.server)}/api/systems/keywords`,
      convertedKeyword,
      { headers: { authorization: `Bearer ${getAccessToken()}` } }
    );
  } catch (error: any) {
    console.error(
      'ERROR DURING KEYWORDS IMPORT: ',
      error.response.data.errors
    );
  }
};

const postCommand = async (command: CustomCommand) => {
  const convertedCommand = {
    command:                command.name,
    enabled:                true,
    visible:                true,
    group:                  'nightbot-import',
    areResponsesRandomized: false,
    responses:              [
      {
        order:          0,
        response:       command.message,
        stopIfExecuted: false,
        permission:     permissions.get(command.userLevel),
        filter:         '',
      },
    ],
  };
  try {
    await axios.post(
      `${JSON.parse(localStorage.server)}/api/systems/customcommands`,
      convertedCommand,
      { headers: { authorization: `Bearer ${getAccessToken()}` } }
    );
  } catch (error: any) {
    console.error(
      'ERROR DURING COMMANDS IMPORT: ',
      error.response.data.errors
    );
  }
};

export const importCustomCommands = async (accessToken: string | null) => {
  const commands = await fetchCustomCommands(accessToken);
  let failCount = 0;
  for (const command of commands) {
    try {
      command.name.startsWith('!')
        ? postCommand(command)
        : postKeyword(command);
    } catch (error: any) {
      failCount++;
    }
  }
  if (failCount > 0) {
    enqueueSnackbar(`${failCount} commands failed to import.`, {
      variant: 'info',
    });
  }
  enqueueSnackbar('Review imported commands.', { variant: 'info' });
  enqueueSnackbar('Commands import completed.', { variant: 'success' });
};
