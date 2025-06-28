import React, { useEffect, useState } from "react";
import ShortcutComp from "./ShortcutComp";
import { Button, message } from "antd";
import {
  DEFAULT_SHORTCUT_LIST,
  PROMPT_LIST_KEY,
  SYSTEM_SHORTCUT_KEY,
} from "../../constant";
import useLocalStorage from "../../hooks/useLocalStorage";
import { EventsEmit } from "../../../wailsjs/runtime/runtime";

function SettingsComp() {
  const [localPromptList, setLocalPromptList] = useState([]);
  const [promptList, setPromptList] = useLocalStorage(PROMPT_LIST_KEY, []);
  const [systemShortcutsLocal, setSystemShortcutsLocal] = useState([]);
  const [systemShortcuts, setSystemShortcuts] = useLocalStorage(
    SYSTEM_SHORTCUT_KEY,
    DEFAULT_SHORTCUT_LIST
  );

  const validateShortcut = () => {
    const list = [...localPromptList, ...systemShortcutsLocal];
    const shortcutMap = new Map();

    for (const item of list) {
      if (!item?.shortcut) continue;

      if (shortcutMap.has(item.shortcut)) {
        return {
          error: true,
          message: `Shortcut already exists: [${item.shortcut}]`,
        };
      }
      shortcutMap.set(item.shortcut, item);
    }

    return { error: false, message: "" };
  };

  const handleSave = () => {
    const validateResult = validateShortcut();
    if (validateResult.error) {
      message.error(validateResult.message);
      return;
    }
    setPromptList(localPromptList);
    setSystemShortcuts(systemShortcutsLocal);
    EventsEmit(
      "syncShortcutList",
      JSON.stringify([...localPromptList, ...systemShortcutsLocal])
    );
  };

  useEffect(() => {
    setLocalPromptList(promptList);
    setSystemShortcutsLocal(systemShortcuts);
  }, []);

  useEffect(() => {
    console.log("SettingsComp");
  }, []);

  return (
    <div>
      <h2>System Shortcuts</h2>
      {systemShortcutsLocal.map((item, index) => (
        <ShortcutComp
          localPrompt={item}
          setLocalPromptList={setSystemShortcutsLocal}
          localPromptList={systemShortcutsLocal}
          key={index}
        />
      ))}
      <h2>Prompt Shortcuts</h2>
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
