import { PlayArrow, Stop, VolumeUp } from '@mui/icons-material';
import { Box, CircularProgress, Fab, Fade, IconButton, Popover, Slider } from '@mui/material';
import React from 'react';

type Props = {
  src: string;
};

export const AudioButton: React.FC<Props> = ({ src }) => {
  const [ progress, setProgress ] = React.useState(0);
  const [ volume, setVolume ] = React.useState(20);
  const [ isPlaying, setPlaying ] = React.useState(false);
  const [ canPlay, setCanPlay ] = React.useState(false);
  const audioRef = React.useRef<HTMLAudioElement>(null);

  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null);

  const handleClick = (ev: React.MouseEvent<HTMLButtonElement>) => {
    ev.stopPropagation();
    ev.preventDefault();
    setAnchorEl(ev.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? 'simple-popover' : undefined;

  const handleChange = (ev: Event, value: number | number[]) => {
    ev.stopPropagation();
    ev.preventDefault();

    if (Array.isArray(value)) {
      value = value[0];
    }

    if (!audioRef.current) {
      return;
    }

    setVolume(value);
    audioRef.current.volume = value / 100;
  };

  const handleProgressClick: React.MouseEventHandler<HTMLSpanElement> = (ev) => {
    ev.stopPropagation();
    ev.preventDefault();

    if (!audioRef.current) {
      return;
    }

    const rect = ev.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const clickX = ev.clientX;
    const clickY = ev.clientY;

    const offsetX = clickX - centerX;
    const offsetY = clickY - centerY;

    const angle = Math.atan2(offsetY, offsetX);
    let degrees = (angle * 180) / Math.PI;
    degrees = degrees < 0 ? degrees + 360 : degrees;

    // Apply the transformation
    degrees += 90;
    if (degrees < 0) {
      degrees += 360;
    }

    let percentage = (degrees / 360) * 100;
    if (percentage > 100) {
      percentage -= 100;
    }
    audioRef.current.currentTime = audioRef.current.duration * (percentage / 100);
    console.log(`Clicked at ${percentage.toFixed(2)}%, setting time to ${(audioRef.current.duration * (percentage / 100)).toFixed(2)}s`);
  };

  return <>
    <Box sx={{ display: 'none'  }}>
      <audio
        ref={ref => {
          if (ref) {
            audioRef.current = ref;
          }
        }}
        preload='metadata'
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onCanPlay={() => setCanPlay(true)}
        onLoadedData={(ev) => ev.currentTarget.volume = 0.2}
        onTimeUpdate={(e) => {
          const audio = e.currentTarget;
          if (!audio) {
            return;
          }
          setProgress((audio.currentTime / audio.duration) * 100);
        }}
        src={`${src}`}
        style={{
          objectFit: 'contain', width: '100%', height: '100%',
        }}
      />
    </Box>
    <Box sx={{
      height:  '100%',
      display: 'flex',
    }}>
      <Box>
        <Fab
          disabled={!canPlay}
          color="light"
          sx={{
            position:  'absolute',
            top:       '50%',
            left:      '50%',
            transform: 'translateX(-50%) translateY(-50%)  !important',
          }}
          onClick={(ev) => {
            ev.stopPropagation();
            ev.preventDefault();
            if (isPlaying) {
              audioRef.current!.pause();
            } else {
              audioRef.current!.play();
            }
          }}>
          {isPlaying ? <Stop /> : <PlayArrow />}
        </Fab>
        <CircularProgress
          size={68}
          sx={{
            position:  'absolute',
            opacity:   0.35,
            zIndex:    1,
            top:       '50%',
            left:      '50%',
            transform: 'translateX(-50%) translateY(-50%) !important',
          }}
          variant="determinate"
          value={100}/>
        <CircularProgress
          onClick={handleProgressClick}
          size={68}
          sx={{
            position:   'absolute',
            zIndex:     1,
            top:        '50%',
            left:       '50%',
            marginLeft: '-34px',
            marginTop:  '-34px',
          }}
          variant={canPlay ? 'determinate' : 'indeterminate'}
          value={progress}/>
      </Box>
      <Box sx={{ height: '100%' }}>
        <Fade in={canPlay}>
          <IconButton onClick={handleClick}><VolumeUp/></IconButton>
        </Fade>
        <Popover
          id={id}
          open={open}
          anchorEl={anchorEl}
          onClose={handleClose}
          PaperProps={{
            sx: {
              height: 150, p: 1, overflow: 'hidden', py: 3,
            },
          }}
          anchorOrigin={{
            vertical:   'bottom',
            horizontal: 'center',
          }}
          transformOrigin={{
            vertical:   'top',
            horizontal: 'center',
          }}
        >
          <Slider orientation='vertical' aria-label="Volume" value={volume} onChange={handleChange} />
        </Popover>
      </Box>
    </Box>
  </>;
};