import { Breadcrumbs, Fade, Typography } from '@mui/material';
import React, { useMemo } from 'react';
import { useLocation } from 'react-router-dom';

import { useTranslation } from '../../hooks/useTranslation';

const v4 = new RegExp(/^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i);

export const AppBarBreadcrumbs: React.FC = () => {
  const location = useLocation();
  const { translate } = useTranslation();

  const breadcrumbsItems = useMemo(() => {
    const path = location.pathname
      .split('/')
      .filter(Boolean)
      .map(o => o.match(v4) ? o : translate(`menu.${o}`))
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