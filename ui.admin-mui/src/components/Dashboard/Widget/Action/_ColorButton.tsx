import styled from '@emotion/styled';
import { Button, ButtonProps } from '@mui/material';
import { getContrastColor } from '@sogebot/ui-helpers/colors';

import { isHexColor } from '../../../../validators';

type ButtonPropsWithColor = ButtonProps & {
  htmlcolor: string,
};

export const ColorButton = styled(Button)<ButtonPropsWithColor>(({ htmlcolor }) => ({
  margin:          '1px',
  color:           getContrastColor(isHexColor(htmlcolor) === true ? htmlcolor : '#444444'),
  backgroundColor: isHexColor(htmlcolor) === true ? htmlcolor : '#444444',
  '&:hover':       { backgroundColor: isHexColor(htmlcolor) === true ? htmlcolor : '#444444' },
}));