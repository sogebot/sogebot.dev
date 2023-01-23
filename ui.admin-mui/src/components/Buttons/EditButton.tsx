import { EditTwoTone } from '@mui/icons-material';
import { ButtonProps } from '@mui/material/Button';
import IconButton, { IconButtonProps } from '@mui/material/IconButton';
import React from 'react';
import { useLocalstorageState } from 'rooks';

export default function EditButton (props: ButtonProps & IconButtonProps) {
  const [server] = useLocalstorageState('server', 'https://demobot.sogebot.xyz');
  return (<IconButton {...props as any} href={props.href && `${props.href}?server=${server}`}><EditTwoTone/></IconButton>);
}