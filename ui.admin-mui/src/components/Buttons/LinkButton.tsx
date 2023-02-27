import Button, { ButtonProps } from '@mui/material/Button';
import React from 'react';
import { useLocalstorageState } from 'rooks';

export default function LinkButton (props: ButtonProps) {
  const [server] = useLocalstorageState('server', 'https://demobot.sogebot.xyz');
  return (<Button {...props} href={props.href && `${props.href}?server=${server}`}>{props.children}</Button>);
}