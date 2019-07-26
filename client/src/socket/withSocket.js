import React from 'react';

const SocketContext = React.createContext(null);

export const withSocket = Component => props => (
    <SocketContext.Consumer>
        {({socket}) => <Component {...props} socket={socket} />}
    </SocketContext.Consumer>
);

export default SocketContext;