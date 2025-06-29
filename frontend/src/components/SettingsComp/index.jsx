import React, { useEffect, useState } from "react";
import ShortcutComp from "./ShortcutComp";
import { Button, Divider, message, Select, Tooltip } from "antd";
import {
  DEFAULT_ORC_LANG,
  DEFAULT_SHORTCUT_LIST,
  ORC_LANG_KEY,
  PROMPT_LIST_KEY,
  SYSTEM_SHORTCUT_KEY,
} from "../../constant";
import useLocalStorage from "../../hooks/useLocalStorage";
import { EventsEmit } from "../../../wailsjs/runtime/runtime";
import {
  DEFAULT_PROMPT_OPTIONS,
  OCR_LANGUAGE_OPTIONS,
} from "../../data/language";
import { InfoCircleOutlined } from "@ant-design/icons";

function SettingsComp() {
  const [ORCLang, setORCLang] = useLocalStorage(ORC_LANG_KEY, DEFAULT_ORC_LANG);
  const [localPromptList, setLocalPromptList] = useState([]);
  const [promptList, setPromptList] = useLocalStorage(
    PROMPT_LIST_KEY,
    DEFAULT_PROMPT_OPTIONS
  );
  const [systemShortcutsLocal, setSystemShortcutsLocal] = useState([]);
  const [systemShortcuts, setSystemShortcuts] = useLocalStorage(
    SYSTEM_SHORTCUT_KEY,
    DEFAULT_SHORTCUT_LIST
  );

  const [messageApi, contextHolder] = message.useMessage();

  const onChangeORCHandler = (value) => {
    if (value.length > 5) {
      messageApi.open({
        type: "error",
        content: "can't select more than 5 languages",
      });
      return;
    }
    setORCLang(value);
  };

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
      {contextHolder}
      <h2>ORC</h2>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Select
          mode="multiple"
          style={{ width: 300 }}
          options={OCR_LANGUAGE_OPTIONS}
          value={ORCLang}
          onChange={onChangeORCHandler}
          placeholder="select recognition languages"
        />
        {/* 添加一个InfoIcon */}
        <Tooltip title={<>Select multiple languages to OCR</>} placement="top">
          <InfoCircleOutlined />
        </Tooltip>
      </div>
      <Divider style={{ margin: "8px 0" }} />

      <h2>System Shortcuts</h2>
      {systemShortcutsLocal.map((item, index) => (
        <ShortcutComp
          localPrompt={item}
          setLocalPromptList={setSystemShortcutsLocal}
          localPromptList={systemShortcutsLocal}
          key={index}
        />
      ))}
      <Divider style={{ margin: "8px 0" }} />

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
