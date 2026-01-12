import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    active: false,
    lastUpdated: null
};

const trayectoSlice = createSlice({
    name: "trayecto",
    initialState,
    reducers: {
        setTrayectoActivo(state, action) {
            state.active = Boolean(action.payload);
            state.lastUpdated = Date.now();
        },
        resetTrayecto(state) {
            state.active = false;
            state.lastUpdated = Date.now();
        }
    }
});

export const { setTrayectoActivo, resetTrayecto } = trayectoSlice.actions;
export default trayectoSlice.reducer;
