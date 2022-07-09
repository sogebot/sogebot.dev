import { grey } from '@mui/material/colors';
import { makeStyles } from '@mui/styles';

import theme from '~/src/theme';

export const useStyles = makeStyles({
  selectAdornment:   { marginRight: theme.spacing(3) },
  colorSliderPicker: {
    width:  '100%',
    height: '50px',
  },
  showTab: {
    opacity:    1,
    transition: 'all 200ms',
    zIndex:     2,
    height:     '100%',
    width:      '100%',
  },
  hideTab: {
    zIndex:     -5,
    opacity:    0,
    transition: 'all 200ms',
    left:       0,
    top:        0,
    height:     '100%',
    width:      '100%',
    position:   'absolute',
  },
  parent: {
    position: 'relative',
    zIndex:   0,
    cursor:   'pointer',
  },
  greyColor:  { color: grey[700] },
  whiteColor: { color: 'white' },
  truncate:   {
    whiteSpace:   'nowrap',
    overflow:     'hidden',
    textOverflow: 'ellipsis',
  },
  backdrop: { position: 'absolute' },
});