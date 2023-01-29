import React from 'react';
import { Route, Routes } from 'react-router-dom';

import Credentials404 from './404';
import DonationAlerts from './credentials/donationalerts';
import Google from './credentials/google';
import Login from './credentials/login';
import OAuth from './credentials/oauth';
import Spotify from './credentials/spotify';
import Streamlabs from './credentials/streamlabs';
import Tiltify from './credentials/tiltify';
import TwitchOwnAppTokens from './credentials/tokens';
import Twitch from './credentials/twitch';

export default function Credentials() {
  return <>
    <Routes>
      <Route path='donationalerts' element={<DonationAlerts/>}/>
      <Route path='google' element={<Google/>}/>
      <Route path='login' element={<Login/>}/>
      <Route path='oauth' element={<OAuth/>}/>
      <Route path='oauth/tokens' element={<TwitchOwnAppTokens/>}/>
      <Route path='spotify' element={<Spotify/>}/>
      <Route path='streamlabs' element={<Streamlabs/>}/>
      <Route path='tiltify' element={<Tiltify/>}/>
      <Route path='twitch' element={<Twitch/>}/>
      <Route path="*" element={<Credentials404/>}/>
    </Routes>
  </>;
}