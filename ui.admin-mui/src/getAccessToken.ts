export default function getAccessToken() {
  return localStorage[`${sessionStorage.currentServer}::accessToken`];
}