import { useMemo, useRef, useState } from 'react';

import { useInterval } from './use-interval';

// Keys are the seconds to wait before showing the message
export type WaitingMessages = Record<number, string>;

function messageForSecondsPassed(waitingMessages: WaitingMessages, seconds: number) {
  return waitingMessages[seconds as keyof typeof waitingMessages];
}

export const useWaitingMessage = (
  waitingMessages: WaitingMessages,
  { waitingMessageInterval } = {
    waitingMessageInterval: 1000,
  }
): [boolean, string, () => void, () => void] => {
  const [isRunning, setIsRunning] = useState(false);
  const [waitingMessage, setWaitingMessage] = useState(messageForSecondsPassed(waitingMessages, 0));
  const handlers = useMemo(
    () => ({
      startWaitingMessage: () => setIsRunning(true),
      stopWaitingMessage: () => setIsRunning(false),
    }),
    []
  );
  const secondsPassed = useRef(0);

  useInterval(
    () => {
      secondsPassed.current += waitingMessageInterval / 1000;
      const newMessage = messageForSecondsPassed(waitingMessages, secondsPassed.current);
      if (newMessage) setWaitingMessage(newMessage);
    },
    isRunning ? waitingMessageInterval : null
  );

  return [isRunning, waitingMessage, handlers.startWaitingMessage, handlers.stopWaitingMessage];
};
