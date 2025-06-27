import { Layout, Tabs } from "antd";
import AskComp from "./components/AskComp";
import ShortcutComp from "./components/ShortcutComp";

const App = () => {
  const onChange = (key) => {
    console.log(key);
  };

  const items = [
    {
      key: "ask",
      label: "Ask",
      children: <AskComp />,
    },
    {
      key: "shortcuts",
      label: "Shortcuts",
      children: <ShortcutComp />,
    },
  ];
  return (
    <Layout
      style={{
        minHeight: "100vh",
        paddingLeft: 8,
        paddingRight: 8,
      }}
    >
      <Tabs defaultActiveKey="ask" items={items} onChange={onChange} />
    </Layout>
  );
};

export default App;
