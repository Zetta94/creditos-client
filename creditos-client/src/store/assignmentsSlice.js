import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as assignmentsService from "../services/assignmentsService";

const emptyMeta = { page: 1, pageSize: 50, totalItems: 0, totalPages: 1 };

export const loadAssignments = createAsyncThunk(
    "assignments/loadAssignments",
    async (params = {}, { rejectWithValue }) => {
        try {
            const response = await assignmentsService.fetchAssignments({ pageSize: 500, ...params });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Error cargando asignaciones");
        }
    }
);

export const loadAssignment = createAsyncThunk(
    "assignments/loadAssignment",
    async (id, { rejectWithValue }) => {
        try {
            const response = await assignmentsService.fetchAssignment(id);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Error cargando asignación");
        }
    }
);

export const addAssignment = createAsyncThunk(
    "assignments/addAssignment",
    async (payload, { rejectWithValue }) => {
        try {
            const response = await assignmentsService.createAssignment(payload);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Error creando asignación");
        }
    }
);

export const saveAssignment = createAsyncThunk(
    "assignments/saveAssignment",
    async ({ id, ...payload }, { rejectWithValue }) => {
        try {
            const response = await assignmentsService.updateAssignment(id, payload);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Error actualizando asignación");
        }
    }
);

export const removeAssignment = createAsyncThunk(
    "assignments/removeAssignment",
    async (id, { rejectWithValue }) => {
        try {
            await assignmentsService.deleteAssignment(id);
            return id;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Error eliminando asignación");
        }
    }
);

const assignmentsSlice = createSlice({
    name: "assignments",
    initialState: {
        list: [],
        meta: emptyMeta,
        current: null,
        loading: false,
        error: null,
    },
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        // Load Assignments
        builder.addCase(loadAssignments.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(loadAssignments.fulfilled, (state, action) => {
            state.list = action.payload?.data ?? [];
            state.meta = action.payload?.meta ?? emptyMeta;
            state.loading = false;
        });
        builder.addCase(loadAssignments.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
        });

        // Load Single Assignment
        builder.addCase(loadAssignment.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(loadAssignment.fulfilled, (state, action) => {
            state.current = action.payload;
            state.loading = false;
        });
        builder.addCase(loadAssignment.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
        });

        // Add Assignment
        builder.addCase(addAssignment.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(addAssignment.fulfilled, (state, action) => {
            state.list.push(action.payload);
            const totalItems = state.meta.totalItems + 1;
            const pageSize = state.meta.pageSize || emptyMeta.pageSize;
            state.meta = {
                ...state.meta,
                totalItems,
                totalPages: Math.max(1, Math.ceil(totalItems / pageSize))
            };
            state.loading = false;
        });
        builder.addCase(addAssignment.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
        });

        // Save Assignment
        builder.addCase(saveAssignment.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(saveAssignment.fulfilled, (state, action) => {
            const index = state.list.findIndex(a => a.id === action.payload.id);
            if (index !== -1) {
                state.list[index] = action.payload;
            }
            state.current = action.payload;
            state.loading = false;
        });
        builder.addCase(saveAssignment.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
        });

        // Remove Assignment
        builder.addCase(removeAssignment.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(removeAssignment.fulfilled, (state, action) => {
            state.list = state.list.filter(a => a.id !== action.payload);
            const totalItems = Math.max(0, state.meta.totalItems - 1);
            const pageSize = state.meta.pageSize || emptyMeta.pageSize;
            state.meta = {
                ...state.meta,
                totalItems,
                totalPages: Math.max(1, Math.ceil(totalItems / pageSize))
            };
            state.loading = false;
        });
        builder.addCase(removeAssignment.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
        });
    },
});

export const { clearError } = assignmentsSlice.actions;
export default assignmentsSlice.reducer;
