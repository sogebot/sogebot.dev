import Button, { ButtonProps } from '@mui/material/Button';
import React from 'react';
import { Link } from 'react-router-dom';
import { useLocalstorageState } from 'rooks';

export default function LinkButton (props: ButtonProps) {
  const [server] = useLocalstorageState('server', 'https://demobot.sogebot.xyz');
  return (<Button {...props} href={props.href && `${props.href}?server=${server}`} LinkComponent={Link}>{props.children}</Button>);
}