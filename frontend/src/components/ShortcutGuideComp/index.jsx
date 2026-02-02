import React from "react";
import { Modal, Typography, Space, Tag, Divider, Button } from "antd";
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
import styles from "./index.module.css";

const { Text, Title } = Typography;

const ShortcutGuideComp = ({ visible, onClose, onNeverShow }) => {
  const systemShortcuts = DEFAULT_SHORTCUT_LIST.map((item, index) => ({
    key: item.value || `sys-${index}`,
    shortcut: item.shortcut,
    desc: item.label,
    icon: item.value === "Open Window" ? <RobotOutlined /> : <CameraOutlined />,
  }));

  const promptShortcuts = DEFAULT_PROMPT_OPTIONS.map((item, index) => ({
    key: item.value || `prompt-${index}`,
    shortcut: item.shortcut,
    desc: item.label,
    color: SHORTCUT_COLORS[index] || "default",
  }));

  const renderShortcutItem = (
    uniqueKey,
    shortcutDisplay,
    desc,
    icon = null,
    color = "default"
  ) => (
    <div key={uniqueKey} className={`${styles.shortcutGuideItem} flex-between`}>
      <div className={styles.shortcutGuideItemLeft}>
        {icon && <span className={styles.shortcutGuideIcon}>{icon}</span>}
        <Text>{desc}</Text>
      </div>
      <Tag color={color} className={styles.shortcutGuideTag}>
        {shortcutDisplay || "Set in Settings"}
      </Tag>
    </div>
  );

  return (
    <Modal
      title={
        <div className={styles.shortcutGuideTitle}>
          <KeyOutlined className={styles.shortcutGuideIcon} />
          <span>🎉 Welcome to PopAsk!</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={480}
      footer={[
        <Text key="tip" type="secondary" className={styles.shortcutGuideFooterTip}>
          💡 You can customize shortcuts in Settings{" "}
        </Text>,
        <Space key="buttons">
          <Text type="link" onClick={onNeverShow} className={styles.shortcutGuideFooterLink}>
            Don't show again
          </Text>
          <Button onClick={onClose} size="small" type="primary">
            Got it!
          </Button>
        </Space>,
      ]}
      closable={true}
    >
      <div className={styles.shortcutGuideBody}>
        {/* Usage Tips */}
        <div className={styles.shortcutGuideTipsBox}>
          <div className={styles.shortcutGuideTipsRow}>
            <BulbOutlined className={styles.shortcutGuideTipsIcon} />
            <div>
              <Text strong className={styles.shortcutGuideTipsTitle}>
                How to use:
              </Text>
              <ul className={styles.shortcutGuideTipsList}>
                <li>Select text in any application</li>
                <li>Press the corresponding shortcut</li>
                <li>PopAsk will automatically process your request</li>
                <li>Customize shortcuts in Settings tab</li>
              </ul>
            </div>
          </div>
        </div>
        {/* System Shortcuts */}
        <div className={styles.shortcutGuideSection}>
          <Title level={5} className={styles.shortcutGuideSectionTitle}>
            <SettingOutlined className={styles.shortcutGuideIcon} />
            System Shortcuts
          </Title>
          <div className={styles.shortcutGuideBox}>
            {systemShortcuts.map((item) =>
              renderShortcutItem(item.key, item.shortcut, item.desc, item.icon, "blue")
            )}
          </div>
        </div>

        <Divider />

        {/* Prompt Shortcuts */}
        <div className={styles.shortcutGuideSection}>
          <Title level={5} className={styles.shortcutGuideSectionTitle}>
            <BulbOutlined className={styles.shortcutGuideSectionIconOrange} />
            Default Prompt Shortcuts
          </Title>
          <div className={styles.shortcutGuideBox}>
            {promptShortcuts.map((item) =>
              renderShortcutItem(item.key, item.shortcut, item.desc, null, item.color)
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ShortcutGuideComp;
