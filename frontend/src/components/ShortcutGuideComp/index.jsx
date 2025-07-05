import React from "react";
import { Modal, Typography, Space, Tag, Divider } from "antd";
import {
  KeyOutlined,
  SettingOutlined,
  BulbOutlined,
  RobotOutlined,
  CameraOutlined,
} from "@ant-design/icons";
import {
  DEFAULT_PROMPT_OPTIONS,
  DEFAULT_SHORTCUT_LIST,
  SHORTCUT_COLORS,
} from "../../constant";

const { Text, Title } = Typography;

const ShortcutGuideComp = ({ visible, onClose, onNeverShow }) => {
  // 使用constant.js中的数据
  const systemShortcuts = DEFAULT_SHORTCUT_LIST.map((item) => ({
    key: item.shortcut,
    desc: item.label,
    icon: item.value === "Open Window" ? <RobotOutlined /> : <CameraOutlined />,
  }));

  const promptShortcuts = DEFAULT_PROMPT_OPTIONS.map((item, index) => ({
    key: item.shortcut,
    desc: item.label,
    color: SHORTCUT_COLORS[index] || "default",
  }));

  const renderShortcutItem = (
    shortcut,
    desc,
    icon = null,
    color = "default"
  ) => (
    <div
      key={shortcut}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 0",
        borderBottom: "1px solid #f0f0f0",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {icon && <span style={{ color: "#1890ff" }}>{icon}</span>}
        <Text>{desc}</Text>
      </div>
      <Tag color={color} style={{ fontFamily: "monospace", fontSize: "12px" }}>
        {shortcut}
      </Tag>
    </div>
  );

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <KeyOutlined style={{ color: "#1890ff" }} />
          <span>🎉 Welcome to PopAsk!</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={480}
      footer={[
        <Text key="tip" type="secondary" style={{ fontSize: "12px" }}>
          💡 You can customize shortcuts in Settings{" "}
        </Text>,
        <Space key="buttons">
          <Text type="link" onClick={onNeverShow} style={{ fontSize: "12px" }}>
            Don't show again
          </Text>
          <button
            onClick={onClose}
            style={{
              padding: "4px 15px",
              backgroundColor: "#1890ff",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Got it!
          </button>
        </Space>,
      ]}
      closable={true}
    >
      <div style={{ padding: "16px 0" }}>
        {/* Usage Tips */}
        <div
          style={{
            backgroundColor: "#e6f7ff",
            border: "1px solid #91d5ff",
            padding: "16px",
            borderRadius: "8px",
            marginTop: "16px",
          }}
        >
          <div
            style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}
          >
            <BulbOutlined style={{ color: "#1890ff", marginTop: "2px" }} />
            <div>
              <Text strong style={{ color: "#1890ff" }}>
                How to use:
              </Text>
              <ul style={{ margin: "8px 0 0 0", paddingLeft: "16px" }}>
                <li>Select text in any application</li>
                <li>Press the corresponding shortcut</li>
                <li>PopAsk will automatically process your request</li>
                <li>Customize shortcuts in Settings tab</li>
              </ul>
            </div>
          </div>
        </div>
        {/* System Shortcuts */}
        <div style={{ marginBottom: "24px" }}>
          <Title
            level={5}
            style={{
              marginBottom: "12px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <SettingOutlined style={{ color: "#52c41a" }} />
            System Shortcuts
          </Title>
          <div
            style={{
              backgroundColor: "#fafafa",
              padding: "12px",
              borderRadius: "8px",
            }}
          >
            {systemShortcuts.map((item) =>
              renderShortcutItem(item.key, item.desc, item.icon, "green")
            )}
          </div>
        </div>

        <Divider />

        {/* Prompt Shortcuts */}
        <div style={{ marginBottom: "24px" }}>
          <Title
            level={5}
            style={{
              marginBottom: "12px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <BulbOutlined style={{ color: "#fa8c16" }} />
            Default Prompt Shortcuts
          </Title>
          <div
            style={{
              backgroundColor: "#fafafa",
              padding: "12px",
              borderRadius: "8px",
            }}
          >
            {promptShortcuts.map((item) =>
              renderShortcutItem(item.key, item.desc, null, item.color)
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ShortcutGuideComp;
