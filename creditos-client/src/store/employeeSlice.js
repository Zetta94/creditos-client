import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as usersService from "../services/usersService";

const emptyMeta = { page: 1, pageSize: 10, totalItems: 0, totalPages: 1 };

export const loadUsers = createAsyncThunk(
  "employees/loadUsers",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await usersService.listUsers(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Error cargando usuarios");
    }
  }
);

export const loadUser = createAsyncThunk(
  "employees/loadUser",
  async (id, { rejectWithValue }) => {
    try {
      const response = await usersService.getUser(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Error cargando usuario");
    }
  }
);

export const addUser = createAsyncThunk(
  "employees/addUser",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await usersService.createUser(payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Error creando usuario");
    }
  }
);

export const saveUser = createAsyncThunk(
  "employees/saveUser",
  async ({ id, ...payload }, { rejectWithValue }) => {
    try {
      const response = await usersService.updateUser(id, payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Error actualizando usuario");
    }
  }
);

export const removeUser = createAsyncThunk(
  "employees/removeUser",
  async (id, { rejectWithValue }) => {
    try {
      await usersService.deleteUser(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Error eliminando usuario");
    }
  }
);

const employeeSlice = createSlice({
  name: "employees",
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
    // Load Users
    builder.addCase(loadUsers.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(loadUsers.fulfilled, (state, action) => {
      state.list = action.payload?.data ?? [];
      state.meta = action.payload?.meta ?? emptyMeta;
      state.loading = false;
    });
    builder.addCase(loadUsers.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Load Single User
    builder.addCase(loadUser.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(loadUser.fulfilled, (state, action) => {
      state.current = action.payload;
      state.loading = false;
    });
    builder.addCase(loadUser.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Add User
    builder.addCase(addUser.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(addUser.fulfilled, (state, action) => {
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
    builder.addCase(addUser.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Save User
    builder.addCase(saveUser.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(saveUser.fulfilled, (state, action) => {
      const index = state.list.findIndex(u => u.id === action.payload.id);
      if (index !== -1) {
        state.list[index] = action.payload;
      }
      state.current = action.payload;
      state.loading = false;
    });
    builder.addCase(saveUser.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Remove User
    builder.addCase(removeUser.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(removeUser.fulfilled, (state, action) => {
      state.list = state.list.filter(u => u.id !== action.payload);
      const totalItems = Math.max(0, state.meta.totalItems - 1);
      const pageSize = state.meta.pageSize || emptyMeta.pageSize;
      state.meta = {
        ...state.meta,
        totalItems,
        totalPages: Math.max(1, Math.ceil(totalItems / pageSize))
      };
      state.loading = false;
    });
    builder.addCase(removeUser.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
  },
});

export const { clearError } = employeeSlice.actions;
export default employeeSlice.reducer;
