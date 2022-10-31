import {
  Breadcrumbs,
  Fade, Typography,
} from '@mui/material';
import { useRouter } from 'next/router';
import { useMemo } from 'react';

import { useTranslation } from '~/src/hooks/useTranslation';

export const AppBarBreadcrumbs: React.FC = () => {
  const router = useRouter();
  const { translate } = useTranslation();

  const breadcrumbsItems = useMemo(() => {
    const path = router.asPath.split('/').filter(Boolean).map(o => translate(`menu.${o}`)).filter(o => !o.startsWith('{menu.'));
    return path;
  }, [router, translate]);

  return (
    <Fade in={breadcrumbsItems && breadcrumbsItems.length > 0}>
      <Breadcrumbs sx={{ width: 'max-content' }}>
        {breadcrumbsItems.map(o => <Typography sx={{ fontWeight: 'bold' }} key={o}>{o}</Typography>)}
      </Breadcrumbs>
    </Fade>
  );
};