import { Grid, Item } from '@mui/material';
import { Box } from '@mui/system';

export default function TwitchEmbed() {
  const room = 'soge';
  const videoUrl = `${window.location.protocol}//player.twitch.tv/?channel=${room}&autoplay=true&parent=${window.location.hostname}`;
  const chatUrl = `${window.location.protocol}//twitch.tv/embed/${room}/chat?darkpopout&parent=${window.location.hostname}`;

  /*
        cols="12"
        md="9"
        lg="9"
        xl="10"*/
  /*
        cols="0"
        md="3"
        lg="3"
        xl="2"*/
  return(
  <Grid container spacing={0}
    sx={{
      height: '100vh'
    }}>
  <Grid item xl={10} md={9} sm={8} xs={12}>
    <iframe
      src={videoUrl}
      height="100%"
      width="100%"
      scrolling="no"
      frameBorder={0}
    />
  </Grid>
    <Grid item xl={2} md={3} sm={4} xs={12}>
      <iframe
        frameBorder={0}
        scrolling="no"
        src={chatUrl}
        height="100%"
        width="100%"
      />
    </Grid>
  </Grid>
  )
}