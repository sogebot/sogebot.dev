import { useWindowSize } from 'rooks';

export default function useMobile() {

  const { innerWidth } = useWindowSize();
  const isMobile = (innerWidth ?? 0) <= 600;

  return isMobile;
}