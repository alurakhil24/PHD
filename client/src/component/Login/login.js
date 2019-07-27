/*eslint-disable */

import React, { Component } from "react";
import MxGraphEditor from '../../MxGraphGridEditor'
import "./Login.css";
import PropTypes from 'prop-types';
import banner from '../../assets/banner.svg';

export default class Login extends Component {
  constructor(props) {
    super(props);
    this.state = {
      userInput: "",
    };
  }
  handleChange = event => {
    this.setState({
      userInput: event.target.value,
    });
  }

  handleSubmit = event => {
    this.props.handleSubmit(this.state.userInput);
  }

  render() {
    return (
      <div className="container-fluid">
        <div className="row">
          <div className="col ">
            <div style={{ background: 'unset' }} className="jumbotron jumbotron-fluid">
              <img src={banner} style={{ height: '20vh', width: '100%' }} />
            </div>
          </div>
        </div>
        <div className="row justify-content-center">
          <div className="col-2 col-md-5 col-sm-6">
            <form onSubmit={(e) =>{e.preventDefault(); this.handleSubmit();} }>
              <div class="form-group">
                <input type="text" onChange={this.handleChange} class="form-control" id="username" aria-describedby="user" placeholder="Enter Username..." />
              </div>
            </form>
            <button onClick={(e) =>{e.preventDefault(); this.handleSubmit();}} style={{ width: '80%' }} type="submit" class="btn btn-primary ">Login</button>
          </div>
        </div>
      </div>
    );
  }
}

Login.propTypes = {
  handleSubmit: PropTypes.func.isRequired,
  handleChange: PropTypes.func.isRequired,
};