export default function getAccessToken() {
  return localStorage[`${sessionStorage.server}::accessToken`];
}