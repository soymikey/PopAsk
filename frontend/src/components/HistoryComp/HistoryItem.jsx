import React from "react";
import {
  Card,
  Typography,
  Button,
  Divider,
  Badge,
} from "antd";
import {
  DeleteOutlined,
  CopyOutlined,
  ClockCircleOutlined,
  MessageOutlined,
  RobotOutlined,
} from "@ant-design/icons";
import { MarkDownComp } from "../MarkDownComp";
import styles from "./index.module.css";

const { Text, Paragraph } = Typography;

function HistoryItem({ item, index, onDelete, onCopy }) {
  return (
    <Card size="small" className={styles.historyItemCard}>
      <div className={styles.historyItemHeader}>
        <div className={styles.historyItemHeaderLeft}>
          <Badge count={index + 1} size="small" className={styles.historyCompBadge} />
          <ClockCircleOutlined />
          <Text type="secondary" className={styles.historyItemTimestamp}>
            {item.timestamp}
          </Text>
        </div>
        <Button
          type="text"
          size="small"
          danger
          icon={<DeleteOutlined />}
          onClick={() => onDelete(index)}
          className={styles.historyItemDeleteBtn}
        />
      </div>

      <Divider className={styles.historyItemDivider} />

      <div className={styles.historyItemMessageBox}>
        <div className={styles.historyItemMessageHeader}>
          <div className={styles.historyItemMessageLabel}>
            <MessageOutlined />
            <Text strong className={styles.historyItemMessageLabel}>
              Message
            </Text>
          </div>
          <Button
            type="text"
            size="small"
            icon={<CopyOutlined />}
            onClick={() => onCopy(item.message)}
            className={`${styles.historyItemCopyBtn} ${styles.historyItemCopyBtnMessage}`}
          >
            Copy
          </Button>
        </div>
        <Paragraph
          className={styles.historyItemMessageContent}
          ellipsis={{ rows: 2, expandable: true, symbol: "Show more" }}
        >
          {item.message}
        </Paragraph>
      </div>

      <div className={styles.historyItemResponseBox}>
        <div className={styles.historyItemResponseHeader}>
          <div className={styles.historyItemResponseLabel}>
            <RobotOutlined />
            <Text strong className={styles.historyItemResponseLabel}>
              Response
            </Text>
          </div>
          <Button
            type="text"
            size="small"
            icon={<CopyOutlined />}
            onClick={() => onCopy(item.response)}
            className={`${styles.historyItemCopyBtn} ${styles.historyItemCopyBtnResponse}`}
          >
            Copy
          </Button>
        </div>
        <MarkDownComp>{item.response}</MarkDownComp>
      </div>
    </Card>
  );
}

export default HistoryItem;
