export default function useSSL() {
  return window.location.protocol === 'https:';
}