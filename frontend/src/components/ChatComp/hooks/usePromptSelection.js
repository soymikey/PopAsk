import { useState, useCallback } from "react";
import { messageGenerator } from "../../../utils";

export function usePromptSelection({
  promptList,
  selectedPrompt,
  setSelectedPrompt,
}) {
  const [selection, setSelection] = useState("");

  const onSelectPromptHandler = useCallback(
    (value) => {
      setSelectedPrompt(value);
      if (value.length === 0) return;
      setSelection((prev) => {
        for (const prompt of promptList) {
          if (prev.startsWith(prompt.value)) {
            return messageGenerator(value, prev.slice(prompt.value.length));
          }
        }
        return messageGenerator(value, prev);
      });
    },
    [promptList, setSelectedPrompt]
  );

  const onChangeSelectionHandler = useCallback(
    (event) => {
      const minLen = (selectedPrompt?.length ?? 0) - 1;
      if (minLen >= 0 && event.target.value.length < minLen) {
        setSelectedPrompt("");
      }
      setSelection(event.target.value);
    },
    [selectedPrompt, setSelectedPrompt]
  );

  return {
    selection,
    setSelection,
    onSelectPromptHandler,
    onChangeSelectionHandler,
  };
}
