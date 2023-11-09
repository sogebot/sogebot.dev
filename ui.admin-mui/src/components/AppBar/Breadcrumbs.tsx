import { Breadcrumbs, Fade, Typography } from '@mui/material';
import React, { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { validate } from 'uuid';

import { useTranslation } from '../../hooks/useTranslation';

export const AppBarBreadcrumbs: React.FC = () => {
  const location = useLocation();
  const { translate } = useTranslation();

  const breadcrumbsItems = useMemo(() => {
    const path = location.pathname
      .split('/')
      .filter(Boolean)
      .map(o => validate(o) ? o : translate(`menu.${o}`))
      .filter(o => !o.startsWith('{menu.'));
    return path;
  }, [location.pathname, translate]);

  return (
    <Fade in={breadcrumbsItems && breadcrumbsItems.length > 0}>
      <Breadcrumbs sx={{ width: 'max-content' }}>
        {breadcrumbsItems.map(o => <Typography sx={{ fontWeight: 'bold' }} key={o}>{o}</Typography>)}
      </Breadcrumbs>
    </Fade>
  );
};