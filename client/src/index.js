import React from "react";
import ReactDOM from "react-dom";
// import MxGraphEditor from "./MxGraphGridEditor";
import "antd/dist/antd.css";
import "./styles.css";
import SocketDemo from './component/SocketConnect';
function App() {
  return (
    <div className="App">
      <SocketDemo />
    </div>
  );
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
