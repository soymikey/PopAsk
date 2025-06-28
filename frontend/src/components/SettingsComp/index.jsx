import React, { useEffect, useState } from "react";
import ShortcutComp from "./ShortcutComp";
import { Button } from "antd";
import { PROMPT_LIST_KEY } from "../../constant";

const SHORTCUT_LIST_KEY = "shortcutList";
function SettingsComp() {
  const [promptList, setPromptList] = useState([]);
  const [shortcutList, setShortcutList] = useState([]);

  const handleAddShortcut = () => {
    setShortcutList([...shortcutList, { p1: "ctrl+shift", p2: "" }]);
  };

  useEffect(() => {
    const shortcutList = localStorage.getItem(SHORTCUT_LIST_KEY);
    try {
      if (shortcutList) {
        setShortcutList(JSON.parse(shortcutList));
      } else {
        setShortcutList([]);
      }
    } catch (error) {
      setShortcutList([]);
    }
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

      {shortcutList.map((shortcut, index) => (
        <ShortcutComp
          promptList={promptList}
          key={index}
          defaultP1={shortcut.p1}
          defaultP2={shortcut.p2}
        />
      ))}
      <Button
        type="primary"
        style={{ marginTop: 10 }}
        onClick={handleAddShortcut}
      >
        Add Shortcut
      </Button>
    </div>
  );
}

export default SettingsComp;
