export type QServer = {
  listen: (port: number, onListen?: () => void, onAbort?: () => void) => {
    close: (onEnd: () => void) => void;
  };
};
