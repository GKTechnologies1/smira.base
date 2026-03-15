import React, { createContext, useContext, useState } from 'react';

const TalkContext = createContext(null);

export function TalkProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [pageContext, setPageContext] = useState(null);

  const openTalk = (ctx = null) => {
    setPageContext(ctx);
    setIsOpen(true);
  };

  const closeTalk = () => {
    setIsOpen(false);
    setPageContext(null);
  };

  return (
    <TalkContext.Provider value={{ isOpen, openTalk, closeTalk, pageContext }}>
      {children}
    </TalkContext.Provider>
  );
}

export function useTalk() {
  return useContext(TalkContext);
}