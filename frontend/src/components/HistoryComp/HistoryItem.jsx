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

const { Text, Paragraph } = Typography;

function HistoryItem({ item, index, onDelete, onCopy }) {
  return (
    <Card
      size="small"
      className="history-item-card"
      bodyStyle={{ padding: "16px" }}
    >
      <div className="history-item-header">
        <div className="history-item-header-left">
          <Badge count={index + 1} size="small" className="history-comp-badge" />
          <ClockCircleOutlined style={{ color: "#8c8c8c" }} />
          <Text type="secondary" className="history-item-timestamp">
            {item.timestamp}
          </Text>
        </div>
        <Button
          type="text"
          size="small"
          danger
          icon={<DeleteOutlined />}
          onClick={() => onDelete(index)}
          className="history-item-delete-btn"
        />
      </div>

      <Divider style={{ margin: "8px 0" }} />

      <div className="history-item-message-box">
        <div className="history-item-message-header">
          <div className="history-item-message-label">
            <MessageOutlined style={{ color: "#262626" }} />
            <Text strong className="history-item-message-label">
              Message
            </Text>
          </div>
          <Button
            type="text"
            size="small"
            icon={<CopyOutlined />}
            onClick={() => onCopy(item.message)}
            className="history-item-copy-btn history-item-copy-btn-message"
          >
            Copy
          </Button>
        </div>
        <Paragraph
          className="history-item-message-content"
          ellipsis={{ rows: 2, expandable: true, symbol: "Show more" }}
        >
          {item.message}
        </Paragraph>
      </div>

      <div className="history-item-response-box">
        <div className="history-item-response-header">
          <div className="history-item-response-label">
            <RobotOutlined style={{ color: "#1890ff" }} />
            <Text strong className="history-item-response-label">
              Response
            </Text>
          </div>
          <Button
            type="text"
            size="small"
            icon={<CopyOutlined />}
            onClick={() => onCopy(item.response)}
            className="history-item-copy-btn history-item-copy-btn-response"
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
