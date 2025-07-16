import {
    StreamCall,
    StreamTheme,
    useCall,
    useCallStateHooks,
    ParticipantView,
} from "@stream-io/video-react-sdk";

import { FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash } from "react-icons/fa";
import { ImPhoneHangUp } from "react-icons/im";
import { useRef, useState, useEffect } from "react";
import { createSocket } from "../utils/socket";
import '@stream-io/video-react-sdk/dist/css/styles.css';

const CustomCallControls = ({ socket }) => {

    const call = useCall();
    const [isMute, setIsMute] = useState(false);
    const [videoOn, setVideoOn] = useState(true);

    if (!call) return null;

    const toggleMic = async () => {
        await call.microphone.toggle();
        setIsMute((prev) => !prev);
    };

    const toggleCamera = async () => {
        await call.camera.toggle();
        setVideoOn((prev) => !prev);
    };

    const leaveCall = async () => {
        await call.leave();
        socket.emit("caller-hangUp")
        window.close();
    };

    return (
        <div className="flex items-center justify-center gap-4 mt-4 z-20 absolute bottom-10 w-screen">
            <button onClick={toggleMic} className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md transition ${isMute ? "bg-white" : "bg-gray-800"}`}>
                {isMute ? <FaMicrophoneSlash className="text-black text-xl" /> : <FaMicrophone className="text-white text-xl" />}
            </button>

            <button onClick={toggleCamera} className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md transition ${videoOn ? "bg-gray-800" : "bg-white"}`}>
                {videoOn ? <FaVideo className="text-white text-xl" /> : <FaVideoSlash className="text-black text-xl" />}
            </button>

            <button onClick={leaveCall} className="w-12 h-12 rounded-full flex items-center justify-center bg-red-600 hover:bg-red-700 transition shadow-md">
                <ImPhoneHangUp className="text-white text-xl" />
            </button>
        </div>
    );
};

const MyFloatingLocalParticipant = ({ participant }) => {
    if (!participant) return null;
    return (
        <div className="absolute bottom-4 right-4 w-48 h-32 z-10 rounded overflow-hidden border-2 border-white shadow-lg bg-black">
            <ParticipantView participant={participant} />
        </div>
    );
};

const MyFullscreenRemoteParticipant = ({ participant }) => {
    if (!participant) return null;
    return (
        <div className="absolute inset-0 z-0">
            <ParticipantView participant={participant} />
        </div>
    );
};

export default function VideoCall({ call, onEnd, caller, username, callee }) {
    const socket = useRef()
    socket.current = createSocket()

    return (
        <StreamTheme>
            <StreamCall call={call}>
                <InnerCallUI onEnd={onEnd} caller={caller} username={username} socket={socket.current} callee={callee} />
            </StreamCall>
        </StreamTheme>
    );
}

const InnerCallUI = ({ onEnd, caller, username, socket, callee }) => {

    const [onlineUsers, setOnlineUsers] = useState([])
    const audioRef = useRef()

    useEffect(() => {
        socket.emit("user-connected", { username, from: "video", token: localStorage.getItem("token") })

        socket.on("timeOut-response", () => {
            window.close()
            alert("Call not answered")
        })

        socket.on("user-list", ({ onlineUsers }) => {
            setOnlineUsers(onlineUsers)
        })

        socket.on("disconnect-alert", (disconnectedUser) => {
            audioRef.current.pause()
            alert(`${disconnectedUser} disconnected`)
            window.close()
        })

        if (isRinging && audioRef.current){
            audioRef.current.play()
        }

        return () => {
            socket.off("timeOut-response")
            socket.off("user-list")
            socket.off("disconnect-alert")
        }

    }, [])

    const { useLocalParticipant, useRemoteParticipants } = useCallStateHooks();
    const localParticipant = useLocalParticipant();
    const remoteParticipants = useRemoteParticipants();

    const isRinging = remoteParticipants.length === 0 ? true : false

    return (
        <div className="w-full h-screen relative bg-black overflow-hidden">
            {isRinging && (caller === username) &&
                <div className="flex justify-center items-center absolute z-10 w-screen top-5">
                    <span className="text-white font-normal text-lg">
                        {onlineUsers.includes(callee) ? "Ringing..." : "Calling..."}
                    </span>
                    <audio ref={audioRef} src="/ring.mp3" loop></audio>
                </div>
            }
            <MyFullscreenRemoteParticipant participant={remoteParticipants[0]} />
            {isRinging ? <MyFullscreenRemoteParticipant participant={localParticipant} /> : <MyFloatingLocalParticipant className="rounded-lg" participant={localParticipant} />}

            <CustomCallControls socket={socket} />
        </div>
    );
};