import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const MOCK_EMAIL = "example@falso.com";
const MOCK_PASS = "12345678";

export const login = createAsyncThunk(
  "auth/login",
  async ({ email, password }, thunkAPI) => {
    // Simular tardanza:
    await new Promise(r => setTimeout(r, 500));
    if (email === MOCK_EMAIL && password === MOCK_PASS) {
      const token = "tok_falso_123456";
      // guardamos en localStorage (mock)
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify({ email }));
      return { token, user: { email } };
    }
    return thunkAPI.rejectWithValue("Credenciales inválidas");
  }
);

export const logout = createAsyncThunk("auth/logout", async () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
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
      .addCase(logout.fulfilled, s => {
        s.token = null;
        s.user = null;
      });
  }
});

export default slice.reducer;
