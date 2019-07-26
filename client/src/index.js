import React from "react";
import ReactDOM from "react-dom";
import MxGraphEditor from "./MxGraphGridEditor";
import "antd/dist/antd.css";
import "./styles.css";
import { Provider } from "react-redux";
import store from './store';
import LoginPage from './component/Login/login.js'
import CustomSocket, { SocketContext } from "./socket";


export default class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      userName: "",
    };
  }
  render() {
    return (
      <Provider store={store}>
        <SocketContext.Provider value={new CustomSocket()}>
          <div className="App">
            {this.state.userName ? <MxGraphEditor userName={this.state.userName} /> :
              <LoginPage handleSubmit={this.handleSubmit} />
            }
          </div>
        </SocketContext.Provider>
      </Provider>
    );
  }

  handleSubmit = (user) => {
    this.setState({
      userName: user,
    });
  }
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
