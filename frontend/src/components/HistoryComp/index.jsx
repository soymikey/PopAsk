import React, { useState } from "react";
import {
  Card,
  Space,
  Typography,
  Button,
  message,
  Empty,
  Tooltip,
  Divider,
  Badge,
  Input,
} from "antd";
import {
  DeleteOutlined,
  CopyOutlined,
  ClockCircleOutlined,
  ClearOutlined,
  MessageOutlined,
  RobotOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { MarkDownComp } from "../MarkDownComp";

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;

function HistoryComp({ historyList, setHistoryList }) {
  const [messageApi, contextHolder] = message.useMessage();
  const [searchKeyword, setSearchKeyword] = useState("");

  // Filter history based on search keyword
  const filteredHistory = historyList.filter((item) => {
    if (!searchKeyword.trim()) return true;
    const keyword = searchKeyword.toLowerCase();
    return (
      item.message.toLowerCase().includes(keyword) ||
      item.response.toLowerCase().includes(keyword)
    );
  });

  const handleDeleteHistory = (index) => {
    const newHistoryList = historyList.filter((_, i) => i !== index);
    setHistoryList(newHistoryList);
    messageApi.open({
      type: "success",
      content: "History item deleted",
    });
  };

  const handleClearAll = () => {
    setHistoryList([]);
    messageApi.open({
      type: "success",
      content: "All history cleared",
    });
  };

  const handleCopyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      messageApi.open({
        type: "success",
        content: "Copied to clipboard",
      });
    } catch (error) {
      messageApi.open({
        type: "error",
        content: "Failed to copy to clipboard",
      });
    }
  };

  const renderHistoryItem = (item, index) => (
    <Card
      size="small"
      style={{
        marginBottom: "12px",
        border: "1px solid #f0f0f0",
        borderRadius: "8px",
        boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
      }}
      bodyStyle={{ padding: "16px" }}
    >
      {/* Header with timestamp and actions */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Badge
            count={index + 1}
            size="small"
            style={{ backgroundColor: "#1890ff" }}
          />
          <ClockCircleOutlined style={{ color: "#8c8c8c" }} />
          <Text type="secondary" style={{ fontSize: "12px" }}>
            {item.timestamp}
          </Text>
        </div>
        <Button
          type="text"
          size="small"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleDeleteHistory(index)}
          style={{ padding: "4px 8px" }}
        />
      </div>

      <Divider style={{ margin: "8px 0" }} />

      {/* Message Section */}
      <div
        style={{
          background: "#f5f5f5",
          padding: "12px",
          borderRadius: "6px",
          border: "1px solid #d9d9d9",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "8px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <MessageOutlined style={{ color: "#262626" }} />
            <Text strong style={{ fontSize: "13px", color: "#262626" }}>
              Message
            </Text>
          </div>
          <Button
            type="text"
            size="small"
            icon={<CopyOutlined />}
            onClick={() => handleCopyToClipboard(item.message)}
            style={{
              padding: "0",
              height: "auto",
              marginTop: "4px",
              color: "#262626",
            }}
          >
            Copy
          </Button>
        </div>
        <Paragraph
          style={{
            margin: "0",
            fontSize: "13px",
            lineHeight: "1.5",
            wordBreak: "break-word",
            color: "#262626",
          }}
          ellipsis={{ rows: 2, expandable: true, symbol: "Show more" }}
        >
          {item.message}
        </Paragraph>
      </div>

      {/* Response Section */}
      <div
        style={{
          background: "#f0f8ff",
          padding: "12px",
          borderRadius: "6px",
          border: "1px solid #91d5ff",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "8px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <RobotOutlined style={{ color: "#1890ff" }} />
            <Text strong style={{ fontSize: "13px", color: "#1890ff" }}>
              Response
            </Text>
          </div>
          <Button
            type="text"
            size="small"
            icon={<CopyOutlined />}
            onClick={() => handleCopyToClipboard(item.response)}
            style={{
              padding: "0",
              height: "auto",
              marginTop: "4px",
              color: "#1890ff",
            }}
          >
            Copy
          </Button>
        </div>
        <MarkDownComp>{item.response}</MarkDownComp>
      </div>
    </Card>
  );

  return (
    <div style={{ paddingBottom: "12px", paddingTop: "12px" }}>
      {contextHolder}

      {/* History List */}
      <Card
        size="small"
        style={{
          border: "1px solid #f0f0f0",
          borderRadius: "8px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        }}
      >
        {/* Header with Clear All button */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: 8,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Title level={4} style={{ margin: 0, color: "#262626" }}>
              Chat History
            </Title>
            {historyList.length > 0 && (
              <Badge
                count={historyList.length}
                size="small"
                style={{
                  backgroundColor: "#1890ff",
                  fontSize: "11px",
                }}
              />
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {historyList.length > 0 && (
              <Tooltip title="Clear all history">
                <Button
                  type="text"
                  danger
                  icon={<ClearOutlined />}
                  onClick={handleClearAll}
                  size="small"
                  style={{
                    borderRadius: "6px",
                    padding: "4px 8px",
                  }}
                >
                  Clear All
                </Button>
              </Tooltip>
            )}
          </div>
        </div>
        <div style={{ padding: "12px 0px" }}>
          <Search
            placeholder="Search messages or responses..."
            allowClear
            style={{ width: 300 }}
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onSearch={setSearchKeyword}
          />
        </div>

        {historyList.length === 0 ? (
          <Empty
            description={
              <div style={{ color: "#8c8c8c" }}>
                <div style={{ fontSize: "14px", marginBottom: "4px" }}>
                  No chat history yet
                </div>
                <div style={{ fontSize: "12px" }}>
                  Start a conversation to see it here
                </div>
              </div>
            }
            style={{ padding: "40px 0" }}
          />
        ) : filteredHistory.length === 0 ? (
          <Empty
            description={
              <div style={{ color: "#8c8c8c" }}>
                <div style={{ fontSize: "14px", marginBottom: "4px" }}>
                  No results found
                </div>
                <div style={{ fontSize: "12px" }}>
                  Try a different search term
                </div>
              </div>
            }
            style={{ padding: "40px 0" }}
          />
        ) : (
          <div
            style={{
              overflowY: "auto",
              paddingRight: "4px",
            }}
          >
            {filteredHistory.map((item, index) => (
              <div key={index}>{renderHistoryItem(item, index)}</div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

export default HistoryComp;
