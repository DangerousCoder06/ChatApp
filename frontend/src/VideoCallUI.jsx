import { useCalls, CallingState } from "@stream-io/video-react-sdk";

export const MyCallUI = () => {
  const calls = useCalls();

  const incomingCalls = calls.filter(
    (call) =>
      call.isCreatedByMe === false &&
      call.state.callingState === CallingState.RINGING,
  );

  const [incomingCall] = incomingCalls;
  if (incomingCall) {
    return <MyIncomingCallUI call={incomingCall} />;
  }

  const outgoingCalls = calls.filter(
    (call) =>
      call.isCreatedByMe === true &&
      call.state.callingState === CallingState.RINGING,
  );

  const [outgoingCall] = outgoingCalls;
  if (outgoingCall) {
    return <MyOutgoingCallUI call={outgoingCall} />;
  }

  return null;
};