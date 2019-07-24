/*eslint-disable */
import io from 'socket.io-client';
import React, { useEffect, useState } from 'react';

const socket = io('http://localhost:5000');

class SocketDemo extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      messages: []
    }
    this.addToMessage = this.addToMessage.bind(this);
  }
  componentDidMount() {
    socket.emit('fromClient', { message: 'Than you so much buddy' });
    socket.on('fromServer', this.addToMessage);
    socket.on('connect', () => this.addToMessage);
    socket.on('mousemoved', (data) => {
      console.log(data.name, data.coordinates);
    })
  }
  addToMessage = ({ message }) => {
    const newMessages = this.state.messages.concat(message);
    this.setState({ messages: newMessages });
  }
  mouseMoveHandler = (event) => {
    const { clientX: x, clientY: y } = event;
    socket.emit('mousemove', { x, y });
  }
  render() {
    return (
      <div onMouseMove={this.mouseMoveHandler}>
        {this.state.messages.map((message, index) => {
          return (
            <h1 key={index}> {message} </h1>
          );
        })}
      </div>
    );
  }
}

export default SocketDemo;