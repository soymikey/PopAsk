import { useState, useMemo } from "react";

export function useHistorySearch(historyList) {
  const [searchKeyword, setSearchKeyword] = useState("");

  const filteredHistory = useMemo(() => {
    if (!searchKeyword.trim()) return historyList ?? [];
    const keyword = searchKeyword.toLowerCase();
    return (historyList ?? []).filter(
      (item) =>
        item.message?.toLowerCase().includes(keyword) ||
        item.response?.toLowerCase().includes(keyword)
    );
  }, [historyList, searchKeyword]);

  return { searchKeyword, setSearchKeyword, filteredHistory };
}
