

import React from 'react';

interface VideoPlayerProps {
  videoKey: string; // The key of the video file in Wasabi
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoKey }) => {
  const videoSrc = `http://localhost:9090/stream?key=${videoKey}`;
  console.log({videoKey})

  return (
    <div style={{margin: 20}}>
      <video
        controls
        width="200"
        height="250"
        src={videoKey}
        // src={'https://coding.load.vshare.net/preview?path=ab3892ab-2666-4490-8766-9c04ad7026a7/6fa12ed3-d5a2-4088-a0bc-d14de0e749f0/fe6397bd-68f0-4902-95e4-13bc3148c778_w2tpOTgifo5x0Ftjp2xtGjkOy.mp4'}
        // poster={'https://img-cdn.pixlr.com/image-generator/history/65bb506dcb310754719cf81f/ede935de-1138-4f66-8ed7-44bd16efc709/medium.webp'}
        onError={(e) => {  
          console.error("Error loading video:", e);
        }}
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
};

export default VideoPlayer;