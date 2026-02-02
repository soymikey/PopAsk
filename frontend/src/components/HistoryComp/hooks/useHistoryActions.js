import { useCallback } from "react";

export function useHistoryActions({
  historyList,
  setHistoryList,
  messageApi,
}) {
  const handleDeleteHistory = useCallback(
    (index) => {
      const newHistoryList = (historyList ?? []).filter((_, i) => i !== index);
      setHistoryList(newHistoryList);
      messageApi.open({
        type: "success",
        content: "History item deleted",
      });
    },
    [historyList, setHistoryList, messageApi]
  );

  const handleClearAll = useCallback(() => {
    setHistoryList([]);
    messageApi.open({
      type: "success",
      content: "All history cleared",
    });
  }, [setHistoryList, messageApi]);

  const handleCopyToClipboard = useCallback(
    async (text) => {
      try {
        await navigator.clipboard.writeText(text);
        messageApi.open({
          type: "success",
          content: "Copied to clipboard",
        });
      } catch {
        messageApi.open({
          type: "error",
          content: "Failed to copy to clipboard",
        });
      }
    },
    [messageApi]
  );

  return { handleDeleteHistory, handleClearAll, handleCopyToClipboard };
}
