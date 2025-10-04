import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import clientsReducer from "./clientsSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    clients: clientsReducer,
  },
});
