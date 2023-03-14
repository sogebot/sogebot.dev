import { ArrowDropDown, FilterAlt } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Container, Divider, FilledInput, FormControlLabel, FormGroup, Grid, IconButton, InputAdornment, Menu, Stack, Switch, Tooltip,
} from '@mui/material';
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { setWidgetsEvents } from '../../../../../store/pageSlice';

export const DashboardWidgetBotDialogFilterEvents: React.FC = () => {
  const dispatch = useDispatch();
  const { configuration } = useSelector((state: any) => state.loader);
  const { events } = useSelector((state: any) => state.page.widgets);

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  React.useEffect(() => {
    if (localStorage.filterEvents) {
      dispatch(setWidgetsEvents(JSON.parse(localStorage.filterEvents)));
    }
  }, [dispatch]);

  const handleEventChange = (type: any, value: any) => {
    localStorage.filterEvents = JSON.stringify({
      ...events,
      [type]: value,
    });
    dispatch(setWidgetsEvents({
      ...events,
      [type]: value,
    }));
  };

  return (
    <>
      <Tooltip title="Filter Events">
        <IconButton onClick={handleClick}>
          <FilterAlt sx={{
            position: 'relative', right: '2px',
          }}/>
          <ArrowDropDown sx={{
            position: 'absolute', right: '2px', bottom: 0, fontSize: '20px',
          }}/>
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
      >
        <Container disableGutters sx={{
          p: 1, height: 'calc(100% - 50px)', maxHeight: 'calc(100% - 50px)', overflow: 'auto',
        }}>
          <Grid container>
            <Grid item xs={6}>
              <FormGroup>
                <FormControlLabel control={<Switch checked={events.showFollows} onClick={() => handleEventChange('showFollows', !events.showFollows)}/>} label="Follows" />
                <FormControlLabel control={<Switch checked={events.showBits} onClick={() => handleEventChange('showBits', !events.showBits)}/>} label="Bits" />
                <FormControlLabel control={<Switch checked={events.showRaids} onClick={() => handleEventChange('showRaids', !events.showRaids)}/>} label="Raids" />
                <FormControlLabel control={<Switch checked={events.showRedeems} onClick={() => handleEventChange('showRedeems', !events.showRedeems)}/>} label="Reward Redeems" />
                <FormControlLabel control={<Switch checked={events.showSubGifts} onClick={() => handleEventChange('showSubGifts', !events.showSubGifts)}/>} label="Subscription gifts" />
                <FormControlLabel control={<Switch checked={events.showSubCommunityGifts} onClick={() => handleEventChange('showSubCommunityGifts', !events.showSubCommunityGifts)}/>} label="Subscription community gifts" />
              </FormGroup>
            </Grid>
            <Grid item xs={6}>
              <FormGroup>
                <FormControlLabel control={<Switch checked={events.showSubs} onClick={() => handleEventChange('showSubs', !events.showSubs)}/>} label="Subs" />
                <Divider/>
                <FormControlLabel control={<Switch disabled={!events.showSubs} checked={events.showSubsPrime} onClick={() => handleEventChange('showSubsPrime', !events.showSubsPrime)}/>} label="Prime" />
                <FormControlLabel control={<Switch disabled={!events.showSubs} checked={events.showSubsTier1} onClick={() => handleEventChange('showSubsTier1', !events.showSubsTier1)}/>} label="Tier 1" />
                <FormControlLabel control={<Switch disabled={!events.showSubs} checked={events.showSubsTier2} onClick={() => handleEventChange('showSubsTier2', !events.showSubsTier2)}/>} label="Tier 2" />
                <FormControlLabel control={<Switch disabled={!events.showSubs} checked={events.showSubsTier3} onClick={() => handleEventChange('showSubsTier3', !events.showSubsTier3)}/>} label="Tier 3" />
              </FormGroup>
            </Grid>
          </Grid>
          <Grid container pt={2}>
            <Grid item xs={12}>
              <FormGroup>
                <FormControlLabel control={<Switch checked={events.showResubs} onClick={() => handleEventChange('showResubs', !events.showResubs)}/>} label="Resubs" />
                <Divider/>
                <FormControlLabel control={<Switch disabled={!events.showResubs} checked={events.showResubsPrime} onClick={() => handleEventChange('showResubsPrime', !events.showResubsPrime)}/>} label="Prime" />
                <FormControlLabel control={<Switch disabled={!events.showResubs} checked={events.showResubsTier1} onClick={() => handleEventChange('showResubsTier1', !events.showResubsTier1)}/>} label="Tier 1" />
                <FormControlLabel control={<Switch disabled={!events.showResubs} checked={events.showResubsTier2} onClick={() => handleEventChange('showResubsTier2', !events.showResubsTier2)}/>} label="Tier 2" />
                <FormControlLabel control={<Switch disabled={!events.showResubs} checked={events.showResubsTier3} onClick={() => handleEventChange('showResubsTier3', !events.showResubsTier3)}/>} label="Tier 3" />
                <Stack direction="row">
                  <FormControlLabel control={<Switch disabled={!events.showResubs} checked={events.showResubsMinimal} onClick={() => handleEventChange('showResubsMinimal', !events.showResubsMinimal)}/>} label="Minimal" />
                  <FilledInput
                    fullWidth
                    hiddenLabel
                    endAdornment={<InputAdornment position="end">months</InputAdornment>}
                    type='number'
                    value={events.showResubsMinimalAmount} onChange={(event) => handleEventChange('showResubsMinimalAmount', Number(event.target.value))}
                    size="small"
                    disabled={!events.showResubs || !events.showResubsMinimal}
                  />
                </Stack>
              </FormGroup>
            </Grid>
          </Grid>
          <Grid container pt={2}>
            <Grid item xs={12}>
              <FormGroup>
                <FormControlLabel control={<Switch checked={events.showTips} onClick={() => handleEventChange('showTips', !events.showTips)}/>} label="Tips" />
                <Divider/>
                <Stack direction="row">
                  <FormControlLabel control={<Switch disabled={!events.showTips} checked={events.showTipsMinimal} onClick={() => handleEventChange('showTipsMinimal', !events.showTipsMinimal)}/>} label="Minimal" />
                  <FilledInput
                    fullWidth
                    hiddenLabel
                    endAdornment={<InputAdornment position="end">{ configuration.currency }</InputAdornment>}
                    type='number'
                    value={events.showTipsMinimalAmount} onChange={(event) => handleEventChange('showTipsMinimalAmount', Number(event.target.value))}
                    size="small"
                    disabled={!events.showTips || !events.showTipsMinimal}
                  />
                </Stack>
              </FormGroup>
            </Grid>
          </Grid>
        </Container>
        <Grid container justifyContent={'end'} sx={{
          height: 'fit-content', pt: 1, pr: 1,
        }}>
          <Grid item alignSelf={'center'}>
            <LoadingButton onClick={handleClose}>Close</LoadingButton>
          </Grid>
        </Grid>
      </Menu>
    </>
  );
};
