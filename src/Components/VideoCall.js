import React from 'react';

function VideoCall() {
  return (
    <div className="video-call-container">
      <iframe
        src="http://localhost:5000"
        title="Video Call App"
        width="100%"
        height="600px"
        allow="camera; microphone; fullscreen"
        style={{ border: 'none' }}
      />
    </div>
  );
}

export default VideoCall;