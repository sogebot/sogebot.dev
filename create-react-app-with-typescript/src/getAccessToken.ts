export default function getAccessToken() {
  return localStorage[`${localStorage.currentServer}::accessToken`];
}