import Button, { ButtonProps } from '@mui/material/Button';
import React from 'react';
import { useSessionstorageState } from 'rooks';

export default function LinkButton (props: ButtonProps) {
  const [server] = useSessionstorageState('server', 'https://demobot.sogebot.xyz');
  return (<Button {...props} href={props.href && `${props.href}?server=${server}`}>{props.children}</Button>);
}