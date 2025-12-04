import { createContext, useContext } from "react";

// Context for signaling when content is ready (prevents flash on refresh)
export const ContentReadyContext = createContext<{
  onReady: () => void;
  isReady: boolean;
}>({
  onReady: () => {},
  isReady: false,
});

export const useContentReady = () => useContext(ContentReadyContext);
