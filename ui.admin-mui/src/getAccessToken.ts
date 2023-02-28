export default function getAccessToken() {
  return localStorage[`${localStorage.server}::accessToken`];
}