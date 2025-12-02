import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  fetchCredits as fetchCreditsService,
  fetchCredit as fetchCreditService,
  createCredit as createCreditService,
  updateCredit as updateCreditService,
  deleteCredit as deleteCreditService
} from "../services/creditsService";

export const loadCredits = createAsyncThunk("credits/loadAll", async (q) => {
  const { data } = await fetchCreditsService(q);
  return data;
});

export const loadCredit = createAsyncThunk("credits/loadOne", async (id) => {
  const { data } = await fetchCreditService(id);
  return data;
});

export const addCredit = createAsyncThunk("credits/add", async (payload) => {
  const { data } = await createCreditService(payload);
  return data;
});

export const saveCredit = createAsyncThunk("credits/save", async ({ id, payload }) => {
  const { data } = await updateCreditService(id, payload);
  return data;
});

export const removeCredit = createAsyncThunk("credits/remove", async (id) => {
  await deleteCreditService(id);
  return id;
});

const slice = createSlice({
  name: "credits",
  initialState: { list: [], current: null, loading: false, error: null },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(loadCredits.pending, s => { s.loading = true; s.error = null; })
      .addCase(loadCredits.fulfilled, (s, a) => { s.loading = false; s.list = a.payload; })
      .addCase(loadCredits.rejected, (s, a) => { s.loading = false; s.error = a.error.message; })
      .addCase(loadCredit.fulfilled, (s, a) => { s.current = a.payload; })
      .addCase(addCredit.fulfilled, (s, a) => { s.list.unshift(a.payload); })
      .addCase(saveCredit.fulfilled, (s, a) => {
        const idx = s.list.findIndex(cr => cr.id === a.payload.id);
        if (idx !== -1) s.list[idx] = a.payload;
        if (s.current?.id === a.payload.id) s.current = a.payload;
      })
      .addCase(removeCredit.fulfilled, (s, a) => {
        s.list = s.list.filter(cr => cr.id !== a.payload);
      });
  }
});

export default slice.reducer;
