import { Input, Select, Card, Space, Typography, Tag, Button, message, Modal } from "antd";
const { Option } = Select;
const { TextArea } = Input;
import { EditOutlined, CheckOutlined, CloseOutlined, DeleteOutlined } from "@ant-design/icons";
import React, { useEffect, useState } from "react";

const { Text } = Typography;

function ShortcutComp({
  localPrompt,
  setLocalPromptList,
  localPromptList,
  isShowDragIcon,
  isMac = false,
  index = 0,
  initialEditMode = false,
  onEditModeConsumed,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editSnapshot, setEditSnapshot] = useState({ label: "", value: "" });
  const [defaultP1, setDefaultP1] = useState(
    isMac ? "cmd+shift" : "ctrl+shift",
  );
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

  const updatePrompt = (field, value) => {
    setLocalPromptList(
      localPromptList.map((prompt, i) =>
        i === index ? { ...prompt, [field]: value } : prompt,
      ),
    );
  };

  const updatePromptShortcut = (shortcut) => {
    updatePrompt("shortcut", shortcut);
  };

  const handleDone = () => {
    const name = (localPrompt?.label ?? "").trim();
    const content = (localPrompt?.value ?? "").trim();
    if (!name) {
      message.warning("Name is required.");
      return;
    }
    if (!content) {
      message.warning("Prompt content is required.");
      return;
    }
    setIsEditing(false);
  };

  const handleStartEdit = () => {
    setEditSnapshot({
      label: localPrompt?.label ?? "",
      value: localPrompt?.value ?? "",
    });
    setIsEditing(true);
  };

  const handleCancel = () => {
    const isNewEmptyCustom =
      localPrompt?.id?.startsWith?.("custom_") &&
      !editSnapshot.label?.trim() &&
      !editSnapshot.value?.trim();
    if (isNewEmptyCustom) {
      setLocalPromptList(localPromptList.filter((_, i) => i !== index));
    } else {
      setLocalPromptList(
        localPromptList.map((prompt, i) =>
          i === index
            ? { ...prompt, label: editSnapshot.label, value: editSnapshot.value }
            : prompt,
        ),
      );
      setIsEditing(false);
    }
  };

  const handleDelete = () => {
    Modal.confirm({
      title: "Delete this prompt?",
      content: "This action cannot be undone.",
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: () => {
        setLocalPromptList(localPromptList.filter((_, i) => i !== index));
      },
    });
  };

  useEffect(() => {
    if (localPrompt?.shortcut) {
      const lastPlusIndex = localPrompt.shortcut.lastIndexOf("+");
      const p1 = localPrompt.shortcut.substring(0, lastPlusIndex);
      const p2 = localPrompt.shortcut.substring(lastPlusIndex + 1);
      setDefaultP1(p1);
      setDefaultP2(p2);
    } else {
      setDefaultP1(isMac ? "cmd+shift" : "ctrl+shift");
    }
  }, [localPrompt, isMac]);

  useEffect(() => {
    if (initialEditMode) {
      setIsEditing(true);
      setEditSnapshot({
        label: localPrompt?.label ?? "",
        value: localPrompt?.value ?? "",
      });
      onEditModeConsumed?.();
    }
  }, [initialEditMode]);

  const selectBefore = (
    <Select
      value={defaultP1}
      onChange={handleP1Change}
      style={{ width: "120px" }}
      size="middle"
    >
      {isMac ? (
        <>
          <Option value="cmd+shift">⌘+Shift</Option>
          <Option value="cmd">⌘</Option>
        </>
      ) : (
        <>
          <Option value="ctrl+shift">Ctrl+Shift</Option>
          <Option value="ctrl">Ctrl</Option>
        </>
      )}
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
      // title={
      //   isShowDragIcon ? (
      //     <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      //       <DragOutlined style={{ color: "#999", cursor: "grab" }} />
      //       <span>Drag to reorder</span>
      //     </div>
      //   ) : null
      // }
    >
      <Space
        style={{ width: "100%", justifyContent: "space-between" }}
        size="small"
      >
        {/* Title and Description - view / edit mode */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {isEditing ? (
            <>
              <Input
                value={localPrompt?.label ?? ""}
                onChange={(e) => updatePrompt("label", e.target.value)}
                placeholder="Name"
                style={{ marginBottom: "8px", fontWeight: 600 }}
              />
              <TextArea
                value={localPrompt?.value ?? ""}
                onChange={(e) => updatePrompt("value", e.target.value)}
                placeholder="Prompt content"
                autoSize={{ minRows: 2, maxRows: 6 }}
                style={{ fontSize: "12px", marginBottom: "8px" }}
              />
              <Space>
                <Button
                  type="primary"
                  size="small"
                  icon={<CheckOutlined />}
                  onClick={handleDone}
                >
                  Done
                </Button>
                <Button
                  size="small"
                  icon={<CloseOutlined />}
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
              </Space>
            </>
          ) : (
            <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Text
                  strong
                  style={{ fontSize: "14px", display: "block", marginBottom: "4px" }}
                >
                  {localPrompt?.label || "—"}
                </Text>
                <Text
                  type="secondary"
                  style={{ fontSize: "12px", lineHeight: "1.4", whiteSpace: "pre-wrap" }}
                >
                  {localPrompt?.value || "—"}
                </Text>
              </div>
              <Space size="small">
                <Button
                  type="text"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={handleStartEdit}
                  title="Edit"
                />
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={handleDelete}
                  title="Delete"
                />
              </Space>
            </div>
          )}
        </div>

        {/* Shortcut Input */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Text
              type="secondary"
              style={{ fontSize: "14px", minWidth: "60px" }}
            >
              Shortcut:
            </Text>
            {defaultP2 && (
              <Tag color="blue" style={{ margin: 0 }}>
                {`${defaultP1}+${defaultP2}`}
              </Tag>
            )}
          </div>

          <Input
            style={{ width: "200px" }}
            addonBefore={selectBefore}
            value={defaultP2}
            onChange={handleChange}
            placeholder="key"
            size="middle"
          />
        </div>
      </Space>
    </Card>
  );
}

export default ShortcutComp;
