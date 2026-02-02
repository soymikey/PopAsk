import React from "react";
import {
  Card,
  Typography,
  Button,
  message,
  Empty,
  Tooltip,
  Input,
  Badge,
} from "antd";
import { ClearOutlined } from "@ant-design/icons";
import { useHistorySearch } from "./hooks/useHistorySearch";
import { useHistoryActions } from "./hooks/useHistoryActions";
import HistoryItem from "./HistoryItem";
import "./index.css";

const { Title } = Typography;
const { Search } = Input;

function HistoryComp({ historyList, setHistoryList }) {
  const [messageApi, contextHolder] = message.useMessage();

  const { searchKeyword, setSearchKeyword, filteredHistory } =
    useHistorySearch(historyList);

  const { handleDeleteHistory, handleClearAll, handleCopyToClipboard } =
    useHistoryActions({
      historyList,
      setHistoryList,
      messageApi,
    });

  return (
    <div className="history-comp-root">
      {contextHolder}

      <Card size="small" className="history-comp-card">
        <div className="history-comp-header">
          <div className="history-comp-header-left">
            <Title level={4} className="history-comp-title">
              Chat History
            </Title>
            {historyList.length > 0 && (
              <Badge
                count={historyList.length}
                size="small"
                style={{ backgroundColor: "#1890ff", fontSize: "11px" }}
              />
            )}
          </div>
          <div className="history-comp-header-right">
            {historyList.length > 0 && (
              <Tooltip title="Clear all history">
                <Button
                  type="text"
                  danger
                  icon={<ClearOutlined />}
                  onClick={handleClearAll}
                  size="small"
                  className="history-comp-clear-btn"
                >
                  Clear All
                </Button>
              </Tooltip>
            )}
          </div>
        </div>

        <div className="history-comp-search-wrap">
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
              <div className="history-comp-empty-desc">
                <div className="history-comp-empty-desc-title">
                  No chat history yet
                </div>
                <div className="history-comp-empty-desc-sub">
                  Start a conversation to see it here
                </div>
              </div>
            }
            style={{ padding: "40px 0" }}
          />
        ) : filteredHistory.length === 0 ? (
          <Empty
            description={
              <div className="history-comp-empty-desc">
                <div className="history-comp-empty-desc-title">
                  No results found
                </div>
                <div className="history-comp-empty-desc-sub">
                  Try a different search term
                </div>
              </div>
            }
            style={{ padding: "40px 0" }}
          />
        ) : (
          <div className="history-comp-list">
            {filteredHistory.map((item, i) => {
              const realIndex = historyList.indexOf(item);
              return (
                <div key={`${realIndex}-${i}-${item?.timestamp}`}>
                  <HistoryItem
                    item={item}
                    index={realIndex}
                    onDelete={handleDeleteHistory}
                    onCopy={handleCopyToClipboard}
                  />
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

export default HistoryComp;
