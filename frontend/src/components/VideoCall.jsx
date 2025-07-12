import {
  StreamCall,
  SpeakerLayout,
  CallControls,
  StreamTheme
} from "@stream-io/video-react-sdk";

import '@stream-io/video-react-sdk/dist/css/styles.css';

export default function VideoCall({ call, onEnd }) {
  if (!call) return null;

  return (
    <StreamTheme>
    <StreamCall call={call}>
      <div className="">
        <div className="">
          <SpeakerLayout />
        </div>
        <div className="">
          <CallControls onLeave={onEnd}/>
        </div>
      </div>
    </StreamCall>
    </StreamTheme>
  );
}
