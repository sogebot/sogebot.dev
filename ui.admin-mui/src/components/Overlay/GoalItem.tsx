import { Box, LinearProgress, linearProgressClasses, Stack } from '@mui/material';
import type { tiltifyCampaign } from '@sogebot/backend/d.ts/src/helpers/socket';
import { Goal } from '@sogebot/backend/dest/database/entity/overlay';
import axios from 'axios';
import gsap from 'gsap';
import HTMLReactParser from 'html-react-parser';
import { isEqual } from 'lodash';
import { nanoid } from 'nanoid';
import React from 'react';
import { useIntervalWhen } from 'rooks';

import type { Props } from './ChatItem';
import { dayjs } from '../../helpers/dayjsHelper';
import { shadowGenerator, textStrokeGenerator } from '../../helpers/text';
import { useAppSelector } from '../../hooks/useAppDispatch';
import { loadFont } from '../Accordion/Font';

const loadedCSS: string[] = [];

const doEnterAnimation = (idx: number, threadId: string, display: {
  type:           'fade';
  durationMs:     number;
  animationInMs:  number;
  animationOutMs: number;
}, haveMoreItems: boolean, retry = 0) => {
  console.log('doEnterAnimation', {
    idx, threadId, display, retry,
  });
  if (retry > 10) {
    return;
  }
  const el = document.getElementById(`wrap-${threadId}-${idx}`);
  if (!el) {
    setTimeout(() => doEnterAnimation(idx, threadId, display, haveMoreItems, retry + 1), 100);
    return;
  }
  gsap.to(el, {
    duration:   display.animationInMs / 1000,
    opacity:    1,
    onComplete: () => {
      if (haveMoreItems) {
        setTimeout(() => doLeaveAnimation(idx, threadId, display), display.durationMs);
      }
    },
  });
};

const doLeaveAnimation = (idx: number, threadId: string, display: {
  type:           'fade';
  durationMs:     number;
  animationInMs:  number;
  animationOutMs: number;
}, retry = 0) => {
  console.log('doLeaveAnimation', {
    idx, threadId, display, retry,
  });
  if (retry > 10) {
    return;
  }
  const el = document.getElementById(`wrap-${threadId}-${idx}`);
  if (!el) {
    setTimeout(() => doLeaveAnimation(idx, threadId, display, retry + 1), 100);
    return;
  }
  gsap.to(el, {
    duration: display.animationOutMs / 1000,
    opacity:  0,
  });
};

/* eslint-disable */
const triggerFunction = (_____________code: string, _____________fnc: 'onChange', _____________currentAmount: number) => {
  eval(
    `(async function() { ${_____________code}; if (typeof ${_____________fnc} === 'function') { console.log('executing ${_____________fnc}(${_____________currentAmount})'); await ${_____________fnc}(_____________currentAmount) } else { console.log('no ${_____________fnc}() function found'); } })()`,
  );
};

export const GoalItem: React.FC<Props<Goal>> = ({ item, width, active, id, groupId }) => {
  item;
  const [ tiltifyCampaigns, setTiltifyCampaigns ] = React.useState<tiltifyCampaign[]>([]);
  const lang = useAppSelector((state: any) => state.loader.configuration.lang );
  const currency = useAppSelector((state: any) => state.loader.configuration.currency );
  const [ threadId ] = React.useState(nanoid());

  const [ lastFadeAt, setLastFadeAt ] = React.useState(0);
  const [ currentGoal, setCurrentGoal ] = React.useState(item.display.type === 'fade' ? item.campaigns.length : 0);

  const [updatedItem, setUpdatedItem] = React.useState(item);

  const encodeFont = (font: string) => {
    return `'${font}'`;
  };

  useIntervalWhen(() => {
    if (!active) {
      return;
    }

    axios.get(`/api/registries/overlays/${groupId}`).then(({ data }) => {
      if (!data.data) {
        return;
      }

      const goals = data.data.items.filter((o: any) => o.opts.typeId === 'goal');
      for (const goal of goals) {
        if (goal.id === id) {
            console.log(`Goal ${goal.id} check.`);
          // we are updating this goal
          if (!isEqual(updatedItem, goal.opts)) {
            console.log(`Goal ${goal.id} updated.`);
            for (const [idx, campaign] of (goal.opts as Goal).campaigns.entries()) {
              campaign.currentAmount = 100;
              if (campaign.currentAmount !== item.campaigns[idx].currentAmount) {
                triggerFunction(campaign.customization.js, 'onChange', Number(campaign.currentAmount ?? 0))
              }
            }
            setUpdatedItem(goal.opts as Goal);
          }
        }
      }
    });
  }, 5000, true, true);

  React.useEffect(() => {
    for (const [idx, campaign] of item.campaigns.entries()) {
      if (campaign.display === 'custom') {
      // load CSS
        if (!loadedCSS.includes(`${threadId}-${idx}`)) {
          console.debug(`loaded custom CSS for ${threadId}-${idx}`);
          loadedCSS.push(`${threadId}-${idx}`);
          const head = document.getElementsByTagName('head')[0];
          const style = document.createElement('style');
          style.type = 'text/css';
          const css = campaign.customization.css
            .replace(/#wrap/g, `#wrap-${threadId}-${idx}`); // replace .wrap with only this goal wrap
          console.log({ css });
          style.appendChild(document.createTextNode(css));
          head.appendChild(style);
        }
      }
    }
  }, [ threadId ]);

  useIntervalWhen(() => {
    if (item.display.type === 'fade') {
      if (lastFadeAt + Number(item.display.durationMs) < Date.now()) {
        setLastFadeAt(Date.now() + Number(item.display.animationInMs) + Number(item.display.animationOutMs));
        if (typeof item.campaigns[currentGoal + 1] === 'undefined') {
          if (currentGoal !== 0) {
            if (item.display.type === 'fade') {
              doEnterAnimation(0, threadId, item.display, item.campaigns.length > 1);
            }
          }
          setCurrentGoal(0);
        } else {
          setCurrentGoal(v => {
            const newIdx = v + 1;
            if (item.display.type === 'fade') {
              doEnterAnimation(newIdx, threadId, item.display, item.campaigns.length > 1);
            }
            return newIdx;
          });
        }
      }
    }
  }, 100, true, true);

  for (const campaign of item.campaigns) {
    loadFont(campaign.customizationFont.family);
  }

  const isDisabled = (campaign: typeof item.campaigns[number]) => {
    return new Date(campaign.endAfter).getTime() <= new Date().getTime() && !campaign.endAfterIgnore;
  };

  const fontStyle = (campaign: typeof item.campaigns[number]) => ({
    fontFamily: encodeFont(campaign.customizationFont.family),
    fontSize:   (campaign.customizationFont.size) + 'px',
    fontWeight: campaign.customizationFont.weight,
    color:      campaign.customizationFont.color,
    textShadow: [
      textStrokeGenerator(
        campaign.customizationFont.borderPx,
        campaign.customizationFont.borderColor,
      ),
      shadowGenerator(campaign.customizationFont.shadow)].filter(Boolean).join(', '),
  });

  const percentage = (campaign: typeof item.campaigns[number]) => {
    let per = (Number(campaign.currentAmount) / Number(campaign.goalAmount)) * 100;
    if (per > 100) {
      per = 100;
    }
    return per;
  };

  useIntervalWhen(() => {
    axios.get('/api/integrations/tiltify/campaigns').then(({data}) => {
      setTiltifyCampaigns(data.data);
    })
  }, 30000, true, true);

  return <Box sx={{
    width:         '100%',
    height:        '100%',
    position:      'relative',
    overflow:      'hidden',
    textTransform: 'none',
    lineHeight:    'initial',
  }}>
    { item.campaigns.map((campaign, idx) => <Stack
      spacing={0}
      sx={{ '& > *': { marginBottom: `${item.display.type === 'multi' ? item.display.spaceBetweenGoalsInPx : 0}px` } }}
    >
      { campaign.display === 'simple' && <Box id={`wrap-${threadId}-${idx}`} sx={{
        width:    '100%',
        position: 'relative',
        filter:   isDisabled(campaign) ? 'grayscale(1)' : 'none',
        display:  item.display.type === 'multi' || (item.display.type === 'fade' && currentGoal === idx) ? undefined : 'none',
        opacity:  item.display.type === 'fade' ? 0 : 1,
      }}>
        <LinearProgress variant="determinate" value={percentage(campaign)}
          sx={{
            height:                                      `${campaign.customizationBar.height}px`,
            [`&.${linearProgressClasses.root}`]:         { border: `${campaign.customizationBar.borderPx}px solid ${campaign.customizationBar.borderColor}` },
            [`&.${linearProgressClasses.colorPrimary}`]: { backgroundColor: `${campaign.customizationBar.backgroundColor}` },
            [`& .${linearProgressClasses.bar}`]:         { backgroundColor: campaign.customizationBar.color },
          }} />
        <Stack direction='row' sx={{
          position:   'absolute',
          lineHeight: `${campaign.customizationBar.height}px`,
          top:        0,
          width:      `${width}px`,
          ...fontStyle(campaign),
        }}>
          <Box sx={{
            width:        '100%',
            maxWidth:     `${width / 3}px`,
            overflow:     'hidden',
            height:       `${campaign.customizationBar.height}px`,
            px:           1,
            textOverflow: 'ellipsis',
            whiteSpace:   'nowrap',
          }}>
            {campaign.name}
          </Box>
          <Box sx={{
            textAlign:    'center',
            width:        '100%',
            maxWidth:     `${width / 3}px`,
            overflow:     'hidden',
            height:       `${campaign.customizationBar.height}px`,
            px:           1,
            textOverflow: 'ellipsis',
            whiteSpace:   'nowrap',
          }}>
            { campaign.type === 'tiltifyCampaign' ? Intl.NumberFormat(lang, {
              style: 'currency', currency: tiltifyCampaigns.find(o => campaign.tiltifyCampaign === o.id)?.causeCurrency || currency,
            }).format(campaign.currentAmount ?? 0)
              : campaign.type.toLowerCase().includes('tips') ? Intl.NumberFormat(lang, {
                style: 'currency', currency: currency,
              }).format(campaign.currentAmount ?? 0)
                : campaign.currentAmount}
          </Box>
          <Box sx={{
            textAlign:    'right',
            width:        '100%',
            maxWidth:     `${width / 3}px`,
            overflow:     'hidden',
            height:       `${campaign.customizationBar.height}px`,
            px:           1,
            textOverflow: 'ellipsis',
            whiteSpace:   'nowrap',
          }}>
            { campaign.type === 'tiltifyCampaign' ? Intl.NumberFormat(lang, {
              style: 'currency', currency: tiltifyCampaigns.find(o => campaign.tiltifyCampaign === o.id)?.causeCurrency || currency,
            }).format(campaign.goalAmount ?? 0)
              : campaign.type.toLowerCase().includes('tips') ? Intl.NumberFormat(lang, {
                style: 'currency', currency: currency,
              }).format(campaign.goalAmount ?? 0)
                : campaign.goalAmount}
          </Box>
        </Stack>
      </Box>}

      { campaign.display === 'full' && <Box id={`wrap-${threadId}-${idx}`} sx={{
        width:    '100%',
        position: 'relative',
        filter:   isDisabled(campaign) ? 'grayscale(1)' : 'none',
        display:  item.display.type === 'multi' || (item.display.type === 'fade' && currentGoal === idx) ? undefined : 'none' ,
        opacity:  item.display.type === 'fade' ? 0 : 1,
      }}>
        <Box sx={{
          width:        '100%',
          overflow:     'hidden',
          px:           1,
          textOverflow: 'ellipsis',
          whiteSpace:   'nowrap',
          textAlign:    'center',
          ...fontStyle(campaign),
        }}>
          {campaign.name}
        </Box>
        <Box sx={{
          width: '100%', position: 'relative ',
        }}>
          <LinearProgress variant="determinate" value={percentage(campaign)}
            sx={{
              height:                                      `${campaign.customizationBar.height}px`,
              [`&.${linearProgressClasses.root}`]:         { border: `${campaign.customizationBar.borderPx}px solid ${campaign.customizationBar.borderColor}` },
              [`&.${linearProgressClasses.colorPrimary}`]: { backgroundColor: `${campaign.customizationBar.backgroundColor}` },
              [`& .${linearProgressClasses.bar}`]:         { backgroundColor: campaign.customizationBar.color },
            }} />
          <Box sx={{
            textAlign:    'center',
            width:        '100%',
            position:     'absolute',
            lineHeight:   `${campaign.customizationBar.height}px`,
            top:          0,
            overflow:     'hidden',
            height:       `${campaign.customizationBar.height}px`,
            px:           1,
            textOverflow: 'ellipsis',
            whiteSpace:   'nowrap',
            ...fontStyle(campaign),
          }}>
            { campaign.type === 'tiltifyCampaign' ? Intl.NumberFormat(lang, {
              style: 'currency', currency: tiltifyCampaigns.find(o => campaign.tiltifyCampaign === o.id)?.causeCurrency || currency,
            }).format(campaign.currentAmount ?? 0)
              : campaign.type.toLowerCase().includes('tips') ? Intl.NumberFormat(lang, {
                style: 'currency', currency: currency,
              }).format(campaign.currentAmount ?? 0)
                : campaign.currentAmount}
            {' '}
              ({ Intl.NumberFormat(lang, { style: 'percent' }).format((campaign.currentAmount ?? 0 )/ (campaign.goalAmount ?? 0)) })
          </Box>
        </Box>

        <Stack direction='row' sx={{
          width: `${width}px`,
          ...fontStyle(campaign),
        }}>
          <Box sx={{
            textAlign:    'left',
            width:        '100%',
            maxWidth:     `${width / 3}px`,
            overflow:     'hidden',
            height:       `${campaign.customizationBar.height}px`,
            px:           1,
            textOverflow: 'ellipsis',
            whiteSpace:   'nowrap',
          }}>
            { campaign.type === 'tiltifyCampaign' ? Intl.NumberFormat(lang, {
              style: 'currency', currency: tiltifyCampaigns.find(o => campaign.tiltifyCampaign === o.id)?.causeCurrency || currency,
            }).format(0)
              : campaign.type.toLowerCase().includes('tips') ? Intl.NumberFormat(lang, {
                style: 'currency', currency: currency,
              }).format(0)
                : 0}
          </Box>
          <Box sx={{
            textAlign:    'center',
            width:        '100%',
            maxWidth:     `${width / 3}px`,
            overflow:     'hidden',
            height:       `${campaign.customizationBar.height}px`,
            px:           1,
            textOverflow: 'ellipsis',
            whiteSpace:   'nowrap',
          }}>
            { !campaign.endAfterIgnore && dayjs().to(campaign.endAfter) }
          </Box>
          <Box sx={{
            textAlign:    'right',
            width:        '100%',
            maxWidth:     `${width / 3}px`,
            overflow:     'hidden',
            height:       `${campaign.customizationBar.height}px`,
            px:           1,
            textOverflow: 'ellipsis',
            whiteSpace:   'nowrap',
          }}>
            { campaign.type === 'tiltifyCampaign' ? Intl.NumberFormat(lang, {
              style: 'currency', currency: tiltifyCampaigns.find(o => campaign.tiltifyCampaign === o.id)?.causeCurrency || currency,
            }).format(campaign.goalAmount ?? 0)
              : campaign.type.toLowerCase().includes('tips') ? Intl.NumberFormat(lang, {
                style: 'currency', currency: currency,
              }).format(campaign.goalAmount ?? 0)
                : campaign.goalAmount}
          </Box>
        </Stack>
      </Box>}

      { campaign.display === 'custom' && <Box id={`wrap-${threadId}-${idx}`}
        sx={{
          width:    '100%',
          position: 'relative',
          filter:   isDisabled(campaign) ? 'grayscale(1)' : 'none',
          display:  item.display.type === 'multi' || (item.display.type === 'fade' && currentGoal === idx) ? undefined : 'none',
          opacity:  item.display.type === 'fade' ? 0 : 1,
        }}>
        {HTMLReactParser(
          campaign.customization.html
            .replaceAll('$name', campaign.name)
            .replaceAll('$currentAmount',
            campaign.type.toLowerCase().includes('tips')
              ? Intl.NumberFormat(lang, {
              maximumFractionDigits: new Intl.NumberFormat(lang, {
                style: 'currency', currency: currency,
              }).resolvedOptions().maximumFractionDigits
            }).format((campaign.currentAmount ?? 0))
            : String(campaign.currentAmount))
            .replaceAll('$percentageAmount', String(percentage(campaign)))
            .replaceAll('$endAfter', campaign.endAfter)
            .replaceAll('$goalAmount', String(campaign.goalAmount)),
        )}
      </Box>}
    </Stack>)}
  </Box>;
};