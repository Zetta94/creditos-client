import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { login as loginService, fetchCurrentUser as fetchCurrentUserService } from "../services/authService";

export const login = createAsyncThunk("auth/login", async (creds, thunkAPI) => {
  try {
    const { data } = await loginService(creds);
    const roleLower = data.user?.role ? data.user.role.toLowerCase() : "";
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    localStorage.setItem("role", roleLower);
    return { ...data, user: { ...data.user, role: roleLower } };
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.message || "Error al iniciar sesión");
  }
});

export const fetchCurrentUser = createAsyncThunk("auth/current", async (_, thunkAPI) => {
  try {
    const { data } = await fetchCurrentUserService();
    const roleLower = data?.role ? data.role.toLowerCase() : "";
    localStorage.setItem("user", JSON.stringify({ ...data, role: roleLower }));
    localStorage.setItem("role", roleLower);
    return { user: { ...data, role: roleLower } };
  } catch (err) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    return thunkAPI.rejectWithValue("Sesión inválida");
  }
});

export const logout = createAsyncThunk("auth/logout", async () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("role");
  return {};
});

const initialState = {
  token: localStorage.getItem("token") || null,
  user: localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")) : null,
  loading: false,
  error: null,
};

const slice = createSlice({
  name: "auth",
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(login.pending, s => { s.loading = true; s.error = null; })
      .addCase(login.fulfilled, (s, a) => {
        s.loading = false;
        s.token = a.payload.token;
        s.user = a.payload.user;
      })
      .addCase(login.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload || a.error.message;
      })
      .addCase(fetchCurrentUser.fulfilled, (s, a) => {
        s.user = a.payload.user;
      })
      .addCase(fetchCurrentUser.rejected, s => {
        s.token = null;
        s.user = null;
      })
      .addCase(logout.fulfilled, s => {
        s.token = null;
        s.user = null;
      });
  }
});

export default slice.reducer;
