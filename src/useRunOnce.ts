import {useRef} from 'react';

export const useRunOnce = (callback: () => void) => {
  const wasCalledRef = useRef<boolean>(false);
  if (!wasCalledRef.current) {
    callback();
    wasCalledRef.current = true;
  }
};
