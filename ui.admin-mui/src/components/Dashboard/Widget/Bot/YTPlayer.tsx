import { currentSongType } from '@backend/database/entity/song';
import { Delete, PlayArrow, PlaylistRemove, SkipNext, Stop } from '@mui/icons-material';
import { Box, FormControl, IconButton, InputLabel, MenuItem, Paper, Select, SelectChangeEvent, SxProps, Table, TableBody, TableCell, TableContainer, TableRow, Tooltip } from '@mui/material';
import axios from 'axios';
import { isEqual } from 'lodash';
import React, { useEffect, useMemo } from 'react';
import YouTube, { YouTubeProps } from 'react-youtube';
import { useDidMount, useIntervalWhen } from 'rooks';

import getAccessToken from '../../../../getAccessToken';
import { getSocket } from '../../../../helpers/socket';
import theme from '../../../../theme';

const emptyCurrentSong: currentSongType = {
  videoId: null, title: '', type: '', username: '', volume: 0, loudness: 0, forceVolume: false, startTime: 0, endTime: Number.MAX_SAFE_INTEGER,
};

export const DashboardWidgetBotYTPlayer: React.FC<{ sx: SxProps }> = ({
  sx,
}) => {
  const [ autoplay, setAutoplay ] = React.useState(false);
  const [ currentTag, setCurrentTag ] = React.useState('general');
  const [ availableTags, setAvailableTags ] = React.useState<string[]>(['general']);
  const [ currentSong, setCurrentSong ] = React.useState(emptyCurrentSong);
  const [ requests, setRequests ] = React.useState<any[]>([]);
  const [ playing, setPlaying ] = React.useState(true);
  const [ player, setPlayer ] = React.useState<any | null>(null);

  const [ volumeSetForId, setVolumeSetForId ] = React.useState('');

  const removeSongRequest = React.useCallback((id: string) => {
    if (confirm('Do you want to delete song request ' + requests.find(o => String(o.id) === id)?.title + ' from ' + requests.find(o => String(o.id) === id)?.username + '?')) {
      console.log('Removing => ' + id);
      setRequests(requests.filter(o => String(o.id) !== id));
      axios.delete('/api/systems/songs/requests/' + id, {
        headers: {
          Authorization: `Bearer ${getAccessToken()}`
        }
      });
    }
  }, [requests]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return [
      h,
      m > 9 ? m : (h ? '0' + m : m || '0'),
      s > 9 ? s : '0' + s,
    ].filter(a => a).join(':');
  };

  const refreshPlaylist = () => {
    axios.get('/api/systems/songs/playlist/tag/current', {
      headers: {
        Authorization: `Bearer ${getAccessToken()}`
      }
    }).then(({ data }) => {
      setCurrentTag(data.data);
    });
    axios.get('/api/systems/songs/playlist/tags', {
      headers: {
        Authorization: `Bearer ${getAccessToken()}`
      }
    }).then(({ data }) => {
      const tags = data.data as string[];
      if (!tags.includes('general')) {
        setAvailableTags(['general', ...tags]);
      } else {
        setAvailableTags(tags);
      }
    });
  };

  const next = () => {
    axios.post('/api/systems/songs/?_action=next', undefined, {
      headers: {
        Authorization: `Bearer ${getAccessToken()}`
      }
    });
  };

  const nextAndRemoveFromPlaylist = () => {
    if (currentSong && currentSong.videoId) {
      axios.delete('/api/systems/songs/playlist/' + currentSong.videoId, {
        headers: {
          Authorization: `Bearer ${getAccessToken()}`
        }
      });
      next();
    }
  };

  useDidMount(() => {
    refreshPlaylist();
  });

  useEffect(() => {
    if (!playing) {
      setVolumeSetForId('');
    }
    getSocket('/systems/songs').off('isPlaying').on('isPlaying', (cb: (isPlaying: boolean) => void) => {
      cb(playing);
    });
  }, [playing]);

  const setPlayerStatus = React.useCallback((play: boolean) => {
    if (player) {
      try {
        if (play) {
          setTimeout(() => player.playVideo(), 1000);
        } else {
          setTimeout(() => player.pauseVideo(), 1000);
        }
      } catch {
        return;
      }
    }
  }, [player]);

  React.useEffect(() => {
    setPlayerStatus(autoplay);
  }, [autoplay, setPlayerStatus]);

  useIntervalWhen(() => {
    try {
      if (player) {
        if (volumeSetForId !== currentSong.videoId) {
          player.setVolume(currentSong.volume);
          setVolumeSetForId(currentSong.videoId ?? '');
        }
        if (player.getCurrentTime() > currentSong.endTime) {
          next();
        }
      }
    } catch {
      return;
    }
  }, 100, true, true);

  useIntervalWhen(async () => {
    await new Promise<void>(resolve => {
      axios.get('/api/systems/songs/current', {
        headers: {
          Authorization: `Bearer ${getAccessToken()}`
        }
      }).then(({ data }) => {
        const botCurrentSong = data.data as currentSongType;
        if (currentSong.videoId !== botCurrentSong.videoId) {
          setCurrentSong(botCurrentSong);
        }
        resolve();
      });
    });

    await new Promise<void>(resolve => {
      axios.get('/api/systems/songs/requests', {
        headers: {
          Authorization: `Bearer ${getAccessToken()}`
        }
      }).then(({ data }) => {
        if (currentSong.videoId === null && autoplay) {
          next();
        }
        if (!isEqual(requests, data.data)) {
          setRequests(data.data);
        }
        resolve();
      });
    });
  }, 1000, true, true);

  useIntervalWhen(() => {
    refreshPlaylist();
  }, 10000, true, true);

  useEffect(() => {
    axios.post('/api/systems/songs/playlist/tag', { tag: currentTag }, {
      headers: {
        Authorization: `Bearer ${getAccessToken()}`
      }
    });
  }, [currentTag]);

  const handlePlaylistTagChange = (event: SelectChangeEvent<string>) => {
    setCurrentTag(event.target.value);
  };

  const opts = useMemo<YouTubeProps['opts']>(() => {
    console.log({
      height:     '100%',
      width:      '100%',
      playerVars: {
        // https://developers.google.com/youtube/player_parameters
        autoplay: autoplay,
        start:    currentSong.startTime,
      },
    });
    return {
      height:     '100%',
      width:      '100%',
      playerVars: {
        // https://developers.google.com/youtube/player_parameters
        autoplay: autoplay,
        start:    currentSong.startTime,
      },
    };
  }, [autoplay, currentSong]);

  return (
    <Box sx={{
      height: '100%', ...sx,
    }}>
      <Box sx={{
        borderBottom: 1, borderColor: 'divider', backgroundColor: theme.palette.grey[900],
      }}>
        <Tooltip title={autoplay ? 'Playing songs' : 'Songs are not playing!'}>
          <IconButton onClick={() => setAutoplay(!autoplay)}>
            {autoplay && <Stop/>}
            {!autoplay && <PlayArrow/>}
          </IconButton>
        </Tooltip>
        <Tooltip title="Skip to next">
          <IconButton onClick={() => next()}>
            <SkipNext/>
          </IconButton>
        </Tooltip>
        <Tooltip title="Skip and remove from playlist">
          <IconButton onClick={() => nextAndRemoveFromPlaylist()}>
            <PlaylistRemove/>
          </IconButton>
        </Tooltip>

        <FormControl fullWidth variant="filled">
          <InputLabel id="playlistLabel">Playlist</InputLabel>
          <Select
            labelId="playlistLabel"
            value={currentTag}
            label="Playlist"
            onChange={handlePlaylistTagChange}
          >
            {availableTags.map(tag => <MenuItem value={tag} key={tag}>{tag}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>

      <Box sx={{
        position: 'relative', height: 'calc(100% - 40px);', overflow: 'auto',
      }}>
        {currentSong.videoId && <YouTube
          style={{ aspectRatio: '16/9' }}
          videoId={currentSong.videoId}
          opts={opts}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnd={() => next()}
          onReady={(event) => {
            setPlaying(false);
            setPlayer(event.target);
          }}
        />}

        <TableContainer component={Paper}>
          <Table size="small" aria-label="a dense table">
            <TableBody>
              {requests.map((request) => (
                <TableRow
                  key={request.id}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell component="th" scope="row">
                    {request.title}
                  </TableCell>
                  <TableCell align="left">{request.username}</TableCell>
                  <TableCell align="left">{formatTime(request.length) }</TableCell>
                  <TableCell align="right"><IconButton onClick={() => removeSongRequest(String(request.id))}><Delete/></IconButton></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
};