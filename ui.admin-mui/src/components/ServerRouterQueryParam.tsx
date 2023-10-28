import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useAppSelector } from '../hooks/useAppDispatch';
import useQuery from '../hooks/useQuery';

export const ServerRouterQueryParam: React.FC = () => {
  const { connectedToServer } = useAppSelector(s => s.loader);
  const navigate = useNavigate();
  const location = useLocation();
  const query = useQuery();

  useEffect(() => {
    const server = query.get('server');
    if (connectedToServer && localStorage.server) {
      const connectedToServerName = JSON.parse(localStorage.server);
      // we need to remove query.server until we solve issue with server GET param
      if (!server || server !== connectedToServerName) {
        navigate(`${location.pathname}?server=${JSON.parse(localStorage.server)}`);
      }
    }
  }, [query, connectedToServer, navigate, location]);

  return null;
};