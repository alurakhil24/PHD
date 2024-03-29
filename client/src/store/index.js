import { createStore, applyMiddleware } from "redux";

// Logger with default options
import logger from "redux-logger";

import reducer from "./reducers";

// export default function configureStore(initialState) {
//     const store = createStore(reducer, initialState, applyMiddleware(logger));
//     return store;
// }

const store = createStore(reducer, applyMiddleware(logger));



export default store;