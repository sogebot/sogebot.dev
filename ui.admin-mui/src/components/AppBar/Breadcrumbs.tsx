import {
  Breadcrumbs,
  Fade, Typography,
} from '@mui/material';
import { useRouter } from 'next/router';
import { useMemo } from 'react';

import translate from '~/src/helpers/translate';

export const AppBarBreadcrumbs: React.FC = () => {
  const router = useRouter();

  const breadcrumbsItems = useMemo(() => {
    const path = router.asPath.split('/').filter(Boolean).map(o => translate(`menu.${o}`));
    return path;
  }, [router]);

  return (
    <Fade in={breadcrumbsItems && breadcrumbsItems.length > 0}>
      <Breadcrumbs sx={{ width: 'max-content' }}>
        {breadcrumbsItems.map(o => <Typography key={o}>{o}</Typography>)}
      </Breadcrumbs>
    </Fade>
  );
};