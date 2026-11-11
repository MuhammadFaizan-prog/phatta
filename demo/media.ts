// Public sample media, no account or login. The Video.js docs demo source (Mux static MP4 rendition).
// P5 adds bright and dark clips for the readability gate; P7 swaps in Faizi's own Mux asset.
export const SAMPLE = {
  src: 'https://stream.mux.com/qos02i3gybD02whhZkP8n2PiOwAP6daR5eBzU00NhGEXNs/highest.mp4',
  poster: 'https://image.mux.com/qos02i3gybD02whhZkP8n2PiOwAP6daR5eBzU00NhGEXNs/thumbnail.webp',
  captions: '/captions/en.vtt',
};

export const mediaHtml = () =>
  `<video src="${SAMPLE.src}" playsinline crossorigin preload="metadata">` +
  `<track kind="subtitles" label="English" srclang="en" src="${SAMPLE.captions}">` +
  `</video>`;
