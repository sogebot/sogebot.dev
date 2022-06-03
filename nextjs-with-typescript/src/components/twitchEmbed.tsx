import { Backdrop, CircularProgress, Grid } from '@mui/material';
import { getSocket } from '@sogebot/ui-helpers/socket';
import { useEffect, useState } from 'react';

export default function TwitchEmbed() {
  const [ room, setRoom ] = useState<null | string>(null);

  const videoUrl = () => {
    return `${window.location.protocol}//player.twitch.tv/?channel=${room}&autoplay=true&parent=${window.location.hostname}`;
  }
  const chatUrl = () => {
    return `${window.location.protocol}//twitch.tv/embed/${room}/chat?darkpopout&parent=${window.location.hostname}`;
  }

  useEffect(() => {
    getSocket('/widgets/chat', true).emit('room', (err, _room) => {
      if (err) {
        console.error(err);
        return;
      }
      setRoom(_room);
    });
  }, [])
  return(
    <><Backdrop
      sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer - 1 }}
      open={room === null}
    >
      <CircularProgress color="inherit" />
    </Backdrop>

  <Grid container spacing={0}
    sx={{
      height: '100vh'
    }}>
  <Grid item xl={10} md={9} sm={8} xs={12}>
    {room && <iframe
      src={videoUrl()}
      height="100%"
      width="100%"
      scrolling="no"
      frameBorder={0}
    />}
  </Grid>
    <Grid item xl={2} md={3} sm={4} xs={12}>
      {room && <iframe
        frameBorder={0}
        scrolling="no"
        src={chatUrl()}
        height="100%"
        width="100%"
      />}
    </Grid>
  </Grid></>
  )
}