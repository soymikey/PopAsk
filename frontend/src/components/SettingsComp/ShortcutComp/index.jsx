import { Input, Select, Card, Space, Typography, Tag } from "antd";
const { Option } = Select;
import React, { useEffect, useState } from "react";

const { Text } = Typography;

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
      style={{ width: "120px" }}
      size="middle"
    >
      <Option value="ctrl+shift">Ctrl+Shift</Option>
      <Option value="ctrl">Ctrl</Option>
    </Select>
  );

  return (
    <Card
      size="small"
      style={{
        border: "1px solid #f0f0f0",
        borderRadius: "8px",
        boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
      }}
      bodyStyle={{ padding: "16px" }}
    >
      <Space direction="vertical" style={{ width: "100%" }} size="small">
        {/* Title and Description */}
        <div>
          <Text
            strong
            style={{ fontSize: "14px", display: "block", marginBottom: "4px" }}
          >
            {localPrompt.label}
          </Text>
          <Text
            type="secondary"
            style={{ fontSize: "12px", lineHeight: "1.4" }}
          >
            {localPrompt.value}
          </Text>
        </div>

        {/* Shortcut Input */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Text type="secondary" style={{ fontSize: "12px", minWidth: "60px" }}>
            Shortcut:
          </Text>
          <Input
            style={{ width: "200px" }}
            addonBefore={selectBefore}
            value={defaultP2}
            onChange={handleChange}
            placeholder="key"
            size="middle"
          />
          {defaultP2 && (
            <Tag color="blue" style={{ margin: 0 }}>
              {`${defaultP1}+${defaultP2}`}
            </Tag>
          )}
        </div>
      </Space>
    </Card>
  );
}

export default ShortcutComp;
