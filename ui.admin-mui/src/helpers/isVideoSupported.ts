const testEl = document.createElement('video');
let mpeg4; let h264;
if (testEl.canPlayType) {
  // Check for MPEG-4 support
  mpeg4 = testEl.canPlayType('video/mp4; codecs="mp4v.20.8"') !== '';

  // Check for h264 support
  h264 = (testEl.canPlayType('video/mp4; codecs="avc1.42E01E"')
        || testEl.canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"')) !== '';
}

const isVideoSupported = mpeg4 || h264;

export { isVideoSupported };
