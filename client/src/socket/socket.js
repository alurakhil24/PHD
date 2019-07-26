import socketio from 'socket.io-client';
const config = {
    // url: "http://in-ppm2179.ingrnet.com:4002",
    url: "http://localhost:4002",
};
class CustomSocket {
    constructor() {
        this.socket = null;
        this.initializeApp(config);

    }

    initializeApp = () => {
        this.socket = socketio.connect(config.url);
    }

    // *** Auth API ***


    // doSignOut = () => this.auth.signOut();

    // doPasswordReset = email => this.auth.sendPasswordResetEmail(email);

    // doSendEmailVerification = () =>
    //     this.auth.currentUser.sendEmailVerification({
    //         url: "http://localhost:3000"
    //     });



}


export default CustomSocket;
