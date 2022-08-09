import {
  Delete, PlayArrow, PlaylistRemove, SkipNext, Stop,
} from '@mui/icons-material';
import {
  Box, FormControl, IconButton, InputLabel, MenuItem, Paper, Select, SelectChangeEvent, Table, TableBody, TableCell, TableContainer, TableRow, Tooltip,
} from '@mui/material';
import { currentSongType } from '@sogebot/backend/src/database/entity/song';
import React, { useEffect, useMemo } from 'react';
import YouTube, { YouTubeProps } from 'react-youtube';
import { useDidMount, useIntervalWhen } from 'rooks';

import { getSocket } from '~/src/helpers/socket';
import theme from '~/src/theme';

const emptyCurrentSong: currentSongType = {
  videoId: null, title: '', type: '', username: '', volume: 0, loudness: 0, forceVolume: false, startTime: 0, endTime: Number.MAX_SAFE_INTEGER,
};

export const DashboardWidgetBotYTPlayer: React.FC<{ className: string }> = ({
  className,
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
      getSocket('/systems/songs').emit('songs::removeRequest', id, () => {
        return true;
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
    getSocket('/systems/songs').emit('current.playlist.tag', (err, tag: string) => {
      if (err) {
        return console.error(err);
      }
      setCurrentTag(tag);
    });
    getSocket('/systems/songs').emit('get.playlist.tags', (err, tags: string[]) => {
      if (err) {
        return console.error(err);
      }
      if (!tags.includes('general')) {
        setAvailableTags(['general', ...tags]);
      } else {
        setAvailableTags(tags);
      }
    });
  };

  const next = () => {
    getSocket('/systems/songs').emit('next');
  };

  const nextAndRemoveFromPlaylist = () => {
    if (currentSong && currentSong.videoId) {
      getSocket('/systems/songs').emit('delete.playlist', currentSong.videoId, () => {
        return true;
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
      if (play) {
        player.playVideo();
      } else {
        player.pauseVideo();
      }
    }
  }, [player]);

  React.useEffect(() => {
    setPlayerStatus(autoplay);
  }, [autoplay, setPlayerStatus]);

  useIntervalWhen(() => {
    if (player) {
      if (volumeSetForId !== currentSong.videoId) {
        player.setVolume(currentSong.volume);
        setVolumeSetForId(currentSong.videoId ?? '');
      }
      if (player.getCurrentTime() > currentSong.endTime) {
        next();
      }
    }
  }, 100, true, true);

  useIntervalWhen(async () => {
    await new Promise<void>(resolve => {
      getSocket('/systems/songs').emit('songs::currentSong', (err, botCurrentSong: currentSongType) => {
        if (err) {
          resolve();
          return console.error(err);
        }
        if (currentSong.videoId !== botCurrentSong.videoId) {
          setCurrentSong(botCurrentSong);
        }
        resolve();
      });
    });

    await new Promise<void>(resolve => {
      getSocket('/systems/songs').emit('songs::getAllRequests', {}, (err, items) => {
        if (err) {
          resolve();
          return console.error(err);
        }
        if (currentSong.videoId === null && autoplay) {
          next();
        }
        setRequests(items);
        resolve();
      });
    });
  }, 1000, true, true);

  useIntervalWhen(() => {
    refreshPlaylist();
  }, 10000, true, true);

  useEffect(() => {
    getSocket('/systems/songs').emit('set.playlist.tag', currentTag);
  }, [currentTag]);

  const handlePlaylistTagChange = (event: SelectChangeEvent<string>) => {
    setCurrentTag(event.target.value);
  };

  const opts = useMemo<YouTubeProps['opts']>(() => {
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
    <Box className={className} sx={{ height: '100%' }}>
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