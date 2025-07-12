import { useEffect, useState } from "react";
import { StreamVideoProvider } from "@stream-io/video-react-sdk";
import { fetchStreamToken } from "../utils/getStreamToken";
import { getVideoClient } from "../utils/videoClient";
import VideoCall from "../components/VideoCall";
import { useSearchParams } from "react-router-dom";

const VideoCallPopup = () => {
  const [searchParams] = useSearchParams();
  const callId = searchParams.get("callId");
  const caller = searchParams.get("caller");
  const callee = searchParams.get("callee");

  const [streamClient, setStreamClient] = useState(null);
  const [callObject, setCallObject] = useState(null);
  const [username, setUsername] = useState(null);

  useEffect(() => {
    const user = localStorage.getItem("username");
    setUsername(user);
  }, []);

  useEffect(() => {
    if (!callId || !username) return;

    const init = async () => {
      const { token, apiKey } = await fetchStreamToken(username)
      const client = getVideoClient(apiKey, username, token)
      setStreamClient(client);

      const call = client.call("default", callId);
      setCallObject(call);

      if (username === caller) {
        await call.getOrCreate({ members: [caller, callee] })
        await call.join()
      } else if (username === callee) {
        await call.join()
      }

      call.on("call.ended", () => {
        window.close();
      });

    };

    init();
  }, [callId, username]);

  if (!streamClient || !callObject) {
    return <div className="text-white p-6">Connecting to video service...</div>;
  }

  return (
    <StreamVideoProvider client={streamClient} theme="dark">
      <VideoCall
        call={callObject}
        onEnd={() => {
          callObject.leave();
          window.close();
        }}
        caller = {caller}
        username = {username}
      />
    </StreamVideoProvider>
  );
};

export default VideoCallPopup;
