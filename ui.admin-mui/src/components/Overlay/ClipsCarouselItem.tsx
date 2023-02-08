/* eslint-disable import/no-unresolved */
import 'swiper/css';
import 'swiper/css/effect-fade';

import { Alert, Box } from '@mui/material';
import { ClipsCarousel } from '@sogebot/backend/dest/database/entity/overlay';
import React from 'react';
import { EffectFade } from 'swiper';
import {
  Swiper, SwiperRef, SwiperSlide,
} from 'swiper/react';

import { isVideoSupported } from '../../helpers/isVideoSupported';
import { getSocket } from '../../helpers/socket';

type Props = {
  item: ClipsCarousel,
  id: string,
  groupId: string,
  /** Overlay is active, e.g. used in overlay */
  active?: boolean,
};

const play = (video: HTMLVideoElement, model: ClipsCarousel, swiper: SwiperRef['swiper']) => {
  video.currentTime = 0;
  video.volume = model.volume / 100;
  video.play().catch((reason) => {
    console.error(`Video cannot be started: ${reason}. Trying again in 1s.`);
    setTimeout(() => play(video, model, swiper), 1000);
  });
  video.onended = () => {
    swiper.slideNext();
  };
};

export const ClipsCarouselItem: React.FC<Props> = ({ item, active }) => {
  const [ model, setModel ] = React.useState(item);
  const [ clips, setClips ] = React.useState<{ id: string, mp4: string }[]>([]);

  React.useEffect(() => {
    if (!active) {
      setModel(item);
    }
  }, [active, item]);

  React.useEffect(() => {
    setTimeout(() => {
      getSocket('/overlays/clipscarousel', true).emit('clips', {
        customPeriod: model?.customPeriod ?? 31, numOfClips: model?.numOfClips ?? 20,
      }, (err, data) => {
        if (err) {
          console.error(err);
          return;
        }
        data.clips = data.clips
          .map((a: any) => ({
            sort: Math.random(), value: a,
          }))
          .sort((a: any, b: any) => a.sort - b.sort)
          .map((a: any) => a.value);

        if (data.clips.length < 4) {
          return console.error('At least 4 clips are needed');
        }

        setClips(data.clips);
      });
    }, 1000);

    if (active) {
      console.log(`====== CLIPSCAROUSEL ======`);
    }
  }, [item]);

  return <>
    { isVideoSupported
      ? <Box sx={{
        width:       '100%',
        height:      '100%',
        overflow:    'hidden',
        '& .swiper': {
          width:      `calc(100% + ${(model.spaceBetween ?? 200) * 2}px)`,
          marginLeft: `-${model.spaceBetween ?? 200}px`,
          height:     '100%',
        },
        '& .swiper-slide-prev': { opacity: 0.5 },
        '& .swiper-slide-next': { opacity: 0.5 },
        '& .swiper-slide':      {
          backgroundPosition: 'center',
          backgroundSize:     'cover',
          height:             '100%',
        },
        '& .swiper-slide img': {
          display: 'block',
          width:   '100%',
        },
      }}>
        {clips.length > 4 && <Swiper
          modules={[EffectFade]}
          effect={model.animation as any}
          fadeEffect={{ crossFade: true }}
          loop={true}
          slidesPerView={3}
          grabCursor={true}
          centeredSlides={true}
          spaceBetween={model.spaceBetween ?? 200}
          onInit={(swiper) => swiper.slideNext()}
          onSlideChangeTransitionEnd={(swiper) => {
            if (!active) {
              return; // don't play on edit
            }
            const slide = swiper.slides[swiper.activeIndex];
            if (slide) {
              const video = slide.firstChild as HTMLVideoElement | null;
              if (video) {
                play(video, model, swiper);
              }
            }
          }}
        >
          {clips.map((clip, idx) => <SwiperSlide key={`${clip.id}-${idx}`}>
            <video preload="auto" playsInline style={{ width: '100%' }}>
              <source src={clip.mp4} type="video/mp4"/>
            </video>
          </SwiperSlide>)}
        </Swiper>}
      </Box>
      : <Box sx={{
        width:          '100%',
        height:         '100%',
        alignItems:     'center',
        justifyContent: 'center',
      }}>
        <Alert severity='error' sx={{ height: 'fit-content' }}>We are sorry, but this browser doesn't support video mp4/h264</Alert>
      </Box>
    }
  </>;
};