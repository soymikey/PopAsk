import { Input, Select } from "antd";
import React, { useEffect, useState } from "react";

function ShortcutComp({ promptList }) {
  const [defaultP1, setDefaultP1] = useState("ctrl+shift");
  const [defaultP2, setDefaultP2] = useState("");
  const [selectedPrompt, setSelectedPrompt] = useState();

  const handleP1Change = (value) => {
    setDefaultP1(value);
    setDefaultP2("");
  };

  const handleChange = (e) => {
    const inputValue = e.target.value;
    const lastChar = inputValue.slice(-1);

    // 只允许数字和字母
    if (/^[a-zA-Z0-9]$/.test(lastChar)) {
      setDefaultP2(lastChar);
    }
  };

  const handleSelectChange = (value) => {
    setSelectedPrompt(value);
  };

  useEffect(() => {
    setDefaultP1(defaultP1);
    setDefaultP2(defaultP2);
  }, [defaultP1, defaultP2]);

  useEffect(() => {
    setSelectedPrompt(promptList[0]);
  }, [promptList]);

  const selectBefore = (
    <Select value={defaultP1} onChange={handleP1Change}>
      <Option value="ctrl+shift">Ctrl+Shift</Option>
      <Option value="ctrl">Ctrl</Option>
    </Select>
  );
  return (
    <div style={{ display: "flex", alignItems: "center", marginTop: 10 }}>
      <Select
        style={{ width: 500, marginRight: 10 }}
        options={promptList.map((prompt, index) => ({
          label: `${prompt}`,
          value: prompt,
        }))}
        onChange={handleSelectChange}
        value={selectedPrompt}
      />
      <Input
        addonBefore={selectBefore}
        value={defaultP2}
        onChange={handleChange}
      />
    </div>
  );
}

export default ShortcutComp;
