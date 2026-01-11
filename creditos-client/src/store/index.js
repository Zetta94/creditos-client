import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import clientsReducer from "./clientsSlice";
import creditsReducer from "./creditsSlice";
import paymentsReducer from "./paymentsSlice";
import assignmentsReducer from "./assignmentsSlice";
import employeeReducer from "./employeeSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    clients: clientsReducer,
    credits: creditsReducer,
    payments: paymentsReducer,
    assignments: assignmentsReducer,
    employees: employeeReducer,
  },
});
