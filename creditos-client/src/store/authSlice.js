import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { login as loginService, fetchCurrentUser as fetchCurrentUserService } from "../services/authService";

const normalizeRole = (value) => (typeof value === "string" ? value.toLowerCase() : "");
const normalizeUser = (user) => (user ? { ...user, role: normalizeRole(user.role) } : null);

export const login = createAsyncThunk("auth/login", async (creds, thunkAPI) => {
  try {
    const { data } = await loginService(creds);
    const normalizedUser = normalizeUser(data.user);
    const roleLower = normalizedUser?.role || "";
    localStorage.setItem("token", data.token);
    if (normalizedUser) {
      localStorage.setItem("user", JSON.stringify(normalizedUser));
    } else {
      localStorage.removeItem("user");
    }
    if (roleLower) localStorage.setItem("role", roleLower);
    else localStorage.removeItem("role");
    return { ...data, user: normalizedUser };
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.message || "Error al iniciar sesión");
  }
});

export const fetchCurrentUser = createAsyncThunk("auth/current", async (_, thunkAPI) => {
  try {
    const { data } = await fetchCurrentUserService();
    const normalizedUser = normalizeUser(data);
    const roleLower = normalizedUser?.role || "";
    if (normalizedUser) {
      localStorage.setItem("user", JSON.stringify(normalizedUser));
    } else {
      localStorage.removeItem("user");
    }
    if (roleLower) localStorage.setItem("role", roleLower);
    else localStorage.removeItem("role");
    return { user: normalizedUser };
  } catch (err) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    return thunkAPI.rejectWithValue({ silent: true, message: "Sesión inválida" });
  }
});

export const logout = createAsyncThunk("auth/logout", async () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("role");
  return {};
});

const storedUser = localStorage.getItem("user");
const initialToken = localStorage.getItem("token");
let initialUser = null;
if (storedUser) {
  try {
    initialUser = normalizeUser(JSON.parse(storedUser));
    localStorage.setItem("user", JSON.stringify(initialUser));
    if (initialUser?.role) localStorage.setItem("role", initialUser.role);
    else localStorage.removeItem("role");
  } catch (error) {
    console.warn("No se pudo leer el usuario de localStorage:", error);
    localStorage.removeItem("user");
  }
}

const initialState = {
  token: initialToken || null,
  user: initialUser,
  loading: false,
  error: null,
  checkingSession: Boolean(initialToken),
};

const slice = createSlice({
  name: "auth",
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(login.pending, s => {
        s.loading = true;
        s.error = null;
      })
      .addCase(login.fulfilled, (s, a) => {
        s.loading = false;
        s.token = a.payload.token;
        s.user = a.payload.user;
        s.error = null;
        s.checkingSession = false;
      })
      .addCase(login.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload || a.error.message;
        s.checkingSession = false;
      })
      .addCase(fetchCurrentUser.pending, s => {
        s.checkingSession = true;
        s.error = null;
      })
      .addCase(fetchCurrentUser.fulfilled, (s, a) => {
        s.user = a.payload.user;
        s.token = localStorage.getItem("token") || null;
        s.checkingSession = false;
        s.error = null;
      })
      .addCase(fetchCurrentUser.rejected, (s, a) => {
        s.token = null;
        s.user = null;
        s.checkingSession = false;
        s.error = a.payload?.silent ? null : (a.payload?.message || a.payload || a.error.message);
      })
      .addCase(logout.fulfilled, s => {
        s.token = null;
        s.user = null;
        s.checkingSession = false;
        s.error = null;
        s.loading = false;
      });
  }
});

export default slice.reducer;
