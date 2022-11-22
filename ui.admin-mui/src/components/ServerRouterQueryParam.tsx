import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';

export const ServerRouterQueryParam: React.FC = () => {
  const { connectedToServer } = useSelector((s: any) => s.loader);
  const router = useRouter();

  useEffect(() => {
    if (connectedToServer && localStorage.server) {
      // we need to remove query.server until we solve issue with server GET param
      if (!router.query.server) {
        router.replace(`${router.asPath}?server=${localStorage.server}`);
      }
    }
  }, [router]);

  return null;
};