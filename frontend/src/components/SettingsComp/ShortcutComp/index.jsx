import { Input, Select } from "antd";
import React, { useEffect, useState } from "react";

function ShortcutComp({ localPrompt, setLocalPromptList, localPromptList }) {
  const [defaultP1, setDefaultP1] = useState("ctrl+shift");
  const [defaultP2, setDefaultP2] = useState("");

  const handleP1Change = (value) => {
    setDefaultP1(value);
    setDefaultP2("");
  };

  const handleChange = (e) => {
    const inputValue = e.target.value;

    // 清空输入时重置状态
    if (inputValue.length === 0) {
      setDefaultP2("");
      updatePromptShortcut("");
      return;
    }

    const lastChar = inputValue.slice(-1).toLowerCase();

    // 只允许数字和字母，自动转换为小写
    if (/^[a-zA-Z0-9]$/.test(lastChar)) {
      setDefaultP2(lastChar);
      updatePromptShortcut(`${defaultP1}+${lastChar}`);
    }
  };

  const updatePromptShortcut = (shortcut) => {
    setLocalPromptList(
      localPromptList.map((prompt) =>
        prompt.value === localPrompt.value ? { ...prompt, shortcut } : prompt
      )
    );
  };

  useEffect(() => {
    if (localPrompt?.shortcut) {
      const lastPlusIndex = localPrompt.shortcut.lastIndexOf("+");
      const p1 = localPrompt.shortcut.substring(0, lastPlusIndex);
      const p2 = localPrompt.shortcut.substring(lastPlusIndex + 1);
      setDefaultP1(p1);
      setDefaultP2(p2);
    }
  }, [localPrompt]);

  const selectBefore = (
    <Select
      value={defaultP1}
      onChange={handleP1Change}
      style={{ width: "110px" }}
    >
      <Option value="ctrl+shift">Ctrl+Shift</Option>
      <Option value="ctrl">Ctrl</Option>
    </Select>
  );
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 10,
      }}
    >
      <div
        style={{
          width: "90%",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {localPrompt.value}
      </div>
      <Input
        style={{ width: "200px" }}
        addonBefore={selectBefore}
        value={defaultP2}
        onChange={handleChange}
      />
    </div>
  );
}

export default ShortcutComp;
