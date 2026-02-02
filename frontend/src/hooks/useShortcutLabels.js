import { useMemo } from "react";

export function useShortcutLabels(isMac) {
  return useMemo(
    () => ({
      newChatText: `New (${isMac ? "Cmd" : "Ctrl"}+N)`,
      clearChatText: `Clear (${isMac ? "Cmd" : "Ctrl"}+K)`,
      saveChatText: `Save (${isMac ? "Cmd" : "Ctrl"}+S)`,
      sendPlaceholderText: `(${isMac ? "Cmd" : "Ctrl"}+Enter to send) (Shift+Enter to send new chat)`,
    }),
    [isMac]
  );
}
