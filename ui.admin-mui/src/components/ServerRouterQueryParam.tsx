import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';

import useQuery from '../hooks/useQuery';

export const ServerRouterQueryParam: React.FC = () => {
  const { connectedToServer } = useSelector((s: any) => s.loader);
  const navigate = useNavigate();
  const location = useLocation();
  const query = useQuery();

  useEffect(() => {
    const server = query.get('server');
    if (connectedToServer && sessionStorage.server) {
      // we need to remove query.server until we solve issue with server GET param
      if (!server) {
        navigate(`${location.pathname}?server=${JSON.parse(sessionStorage.server)}`);
      }
    }
  }, [query, connectedToServer, navigate, location]);

  return null;
};