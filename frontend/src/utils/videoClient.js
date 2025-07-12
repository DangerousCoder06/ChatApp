import { StreamVideoClient } from "@stream-io/video-react-sdk";

export const getVideoClient = (apiKey, userId, token) => {
  return new StreamVideoClient({
    apiKey,
    user: { id: userId },
    token,
  });
};
