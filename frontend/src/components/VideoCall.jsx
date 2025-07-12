import {
    StreamCall,
    SpeakerLayout,
    StreamTheme,
    useCall
} from "@stream-io/video-react-sdk";
import { useState } from "react";
import { FaMicrophone } from "react-icons/fa";
import { FaMicrophoneSlash } from "react-icons/fa";
import { FaVideo } from "react-icons/fa";
import { FaVideoSlash } from "react-icons/fa6";
import { ImPhoneHangUp } from "react-icons/im";

import '@stream-io/video-react-sdk/dist/css/styles.css';

const CustomCallControls = () => {
    const [isMute, setIsMute] = useState(false)
    const [videoOn, setVideoOn] = useState(true)
    const call = useCall()

    if (!call){
        return null
    }  

    const toggleMic = async () => {
        await call.microphone.toggle()
        setIsMute(!isMute)
    };

    const toggleCamera = async () => {
        await call.camera.toggle()
        setVideoOn(!videoOn)
    };

    const leaveCall = async () => {
        await call.leave()
        window.close()
    };

    return (
        <div className="flex items-center justify-center gap-4 mt-4">

            <button
                onClick={toggleMic}
                className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md transition ${isMute ? "bg-white" : "bg-gray-800"
                    }`}>
                {isMute ? (
                    <FaMicrophoneSlash className="text-black text-xl" />
                ) : (
                    <FaMicrophone className="text-white text-xl" />
                )}
            </button>

            <button
                onClick={toggleCamera}
                className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md transition ${videoOn ? "bg-gray-800" : "bg-white"
                    }`}>
                {videoOn ? (
                    <FaVideo className="text-white text-xl" />
                ) : (
                    <FaVideoSlash className="text-black text-xl" />
                )}
            </button>

            <button
                onClick={leaveCall}
                className="w-12 h-12 rounded-full flex items-center justify-center bg-red-600 hover:bg-red-700 transition shadow-md">
                <ImPhoneHangUp className="text-white text-xl" />
            </button>

        </div>
    );
};

export default function VideoCall({ call, onEnd }) {
    if (!call){
        return null
    } 

    return (
        <StreamTheme>
            <StreamCall call={call}>
                <div className="">
                    <div className="">
                        <SpeakerLayout />
                    </div>
                    <div className="">
                        <CustomCallControls onLeave={onEnd} />
                    </div>
                </div>
            </StreamCall>
        </StreamTheme>
    );
}
