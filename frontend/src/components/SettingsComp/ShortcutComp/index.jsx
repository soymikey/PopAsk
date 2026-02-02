import {
  Input,
  Select,
  Card,
  Space,
  Typography,
  Tag,
  Button,
  message,
  Modal,
} from "antd";
const { Option } = Select;
const { TextArea } = Input;
import {
  EditOutlined,
  CheckOutlined,
  CloseOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import React, { useEffect, useState } from "react";
import { VALIDATION_MSGS } from "../../../constant";
import { formatShortcutDisplay } from "../../../utils";
import styles from "./index.module.css";

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
  const [editSnapshot, setEditSnapshot] = useState({
    label: "",
    value: "",
    shortcut: "",
  });
  const shortcut = localPrompt?.shortcut ?? "";
  const lastPlusIndex = shortcut.lastIndexOf("+");
  const defaultP1 =
    lastPlusIndex >= 0
      ? shortcut.substring(0, lastPlusIndex)
      : shortcut || (isMac ? "cmd+shift" : "ctrl+shift");
  const defaultP2 =
    lastPlusIndex >= 0 ? shortcut.substring(lastPlusIndex + 1) : "";

  const handleP1Change = (value) => {
    updatePromptShortcut(value);
  };

  const handleChange = (e) => {
    const inputValue = e.target.value;
    if (inputValue.length === 0) {
      updatePromptShortcut(defaultP1);
      return;
    }
    const lastChar = inputValue.slice(-1).toLowerCase();
    if (/^[a-zA-Z0-9]$/.test(lastChar)) {
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
      message.warning(VALIDATION_MSGS.NAME_REQUIRED);
      return;
    }
    if (!content) {
      message.warning(VALIDATION_MSGS.PROMPT_CONTENT_REQUIRED);
      return;
    }
    if (!localPrompt?.shortcut) {
      message.warning(VALIDATION_MSGS.SHORTCUT_REQUIRED);
      return;
    }
    setIsEditing(false);
  };

  const handleStartEdit = () => {
    setEditSnapshot({
      label: localPrompt?.label ?? "",
      value: localPrompt?.value ?? "",
      shortcut: localPrompt?.shortcut ?? "",
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
            ? {
                ...prompt,
                label: editSnapshot.label,
                value: editSnapshot.value,
                shortcut: editSnapshot.shortcut,
              }
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
    if (initialEditMode) {
      setIsEditing(true);
      setEditSnapshot({
        label: localPrompt?.label ?? "",
        value: localPrompt?.value ?? "",
        shortcut: localPrompt?.shortcut ?? "",
      });
      onEditModeConsumed?.();
    }
  }, [initialEditMode]);

  const selectBefore = (
    <Select
      value={defaultP1}
      onChange={handleP1Change}
      className={styles.shortcutCompSelectBefore}
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
    <Card size="small" className={`${styles.shortcutCompCard} card-subtle`}>
      <Space className={`${styles.shortcutCompSpace} flex-between`} size="small">
        {/* Title and Description - view / edit mode */}
        <div className={`${styles.shortcutCompContent} flex-1`}>
          {isEditing ? (
            <>
              <Input
                value={localPrompt?.label ?? ""}
                onChange={(e) => updatePrompt("label", e.target.value)}
                placeholder="Name"
                className={styles.shortcutCompInputName}
              />
              <TextArea
                value={localPrompt?.value ?? ""}
                onChange={(e) => updatePrompt("value", e.target.value)}
                placeholder="Prompt content"
                autoSize={{ minRows: 2, maxRows: 6 }}
                className={styles.shortcutCompTextarea}
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
            <div className={styles.shortcutCompViewRow}>
              <div className={`${styles.shortcutCompViewContent} flex-1`}>
                <Text strong className={styles.shortcutCompLabel}>
                  {localPrompt?.label || "—"}
                </Text>
                <Text type="secondary" className={styles.shortcutCompValue}>
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
        <div className={`${styles.shortcutCompShortcutWrap} flex-col`}>
          <div className={styles.shortcutCompShortcutRow}>
            <Text type="secondary" className={styles.shortcutCompShortcutLabel}>
              Shortcut:
            </Text>
            {defaultP2 && (
              <Tag color="blue" className={styles.shortcutCompTag}>
                {formatShortcutDisplay(`${defaultP1}+${defaultP2}`)}
              </Tag>
            )}
          </div>

          {isEditing && (
            <Input
              disabled={!isEditing}
              className={styles.shortcutCompInputShortcut}
              addonBefore={selectBefore}
              value={defaultP2}
              onChange={handleChange}
              placeholder="key"
              size="middle"
            />
          )}
        </div>
      </Space>
    </Card>
  );
}

export default ShortcutComp;
