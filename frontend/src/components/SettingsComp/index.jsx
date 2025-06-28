import React, { useEffect, useState } from "react";
import ShortcutComp from "./ShortcutComp";
import { Button } from "antd";
import { PROMPT_LIST_KEY } from "../../constant";
import useLocalStorage from "../../hooks/useLocalStorage";

function SettingsComp() {
  const [localPromptList, setLocalPromptList] = useState([]);
  const [promptList, setPromptList] = useLocalStorage(PROMPT_LIST_KEY, []);

  const handleSave = () => {
    setPromptList(localPromptList);
  };

  useEffect(() => {
    setLocalPromptList(promptList);
  }, []);

  useEffect(() => {
    const promptList = localStorage.getItem(PROMPT_LIST_KEY);
    try {
      if (promptList) {
        setPromptList(JSON.parse(promptList));
      } else {
        setPromptList([]);
      }
    } catch (error) {
      setPromptList([]);
    }
  }, []);
  return (
    <div>
      <h1>Settings</h1>

      {localPromptList.map((prompt, index) => (
        <ShortcutComp
          localPrompt={prompt}
          setLocalPromptList={setLocalPromptList}
          localPromptList={localPromptList}
          key={index}
        />
      ))}
      <div style={{ display: "flex", justifyContent: "center", marginTop: 20 }}>
        <Button type="primary" onClick={handleSave}>
          Save
        </Button>
      </div>
    </div>
  );
}

export default SettingsComp;
