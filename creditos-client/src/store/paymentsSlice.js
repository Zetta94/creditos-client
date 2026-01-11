import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  fetchPayments as fetchPaymentsService,
  fetchPayment as fetchPaymentService,
  createPayment as createPaymentService,
  updatePayment as updatePaymentService,
  deletePayment as deletePaymentService
} from "../services/paymentsService";

const emptyMeta = { page: 1, pageSize: 10, totalItems: 0, totalPages: 1 };

export const loadPayments = createAsyncThunk("payments/loadAll", async (params = {}) => {
  const response = await fetchPaymentsService(params);
  return response.data;
});

export const loadPayment = createAsyncThunk("payments/loadOne", async (id) => {
  const { data } = await fetchPaymentService(id);
  return data;
});

export const addPayment = createAsyncThunk("payments/add", async (payload) => {
  const { data } = await createPaymentService(payload);
  return data;
});

export const savePayment = createAsyncThunk("payments/save", async ({ id, payload }) => {
  const { data } = await updatePaymentService(id, payload);
  return data;
});

export const removePayment = createAsyncThunk("payments/remove", async (id) => {
  await deletePaymentService(id);
  return id;
});

const slice = createSlice({
  name: "payments",
  initialState: { list: [], meta: emptyMeta, current: null, loading: false, error: null },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(loadPayments.pending, s => { s.loading = true; s.error = null; })
      .addCase(loadPayments.fulfilled, (s, a) => {
        s.loading = false;
        s.list = a.payload?.data ?? [];
        s.meta = a.payload?.meta ?? emptyMeta;
      })
      .addCase(loadPayments.rejected, (s, a) => { s.loading = false; s.error = a.error.message; })
      .addCase(loadPayment.fulfilled, (s, a) => { s.current = a.payload; })
      .addCase(addPayment.fulfilled, (s, a) => {
        s.list.unshift(a.payload);
        const totalItems = s.meta.totalItems + 1;
        const pageSize = s.meta.pageSize || emptyMeta.pageSize;
        s.meta = {
          ...s.meta,
          totalItems,
          totalPages: Math.max(1, Math.ceil(totalItems / pageSize))
        };
      })
      .addCase(savePayment.fulfilled, (s, a) => {
        const idx = s.list.findIndex(p => p.id === a.payload.id);
        if (idx !== -1) s.list[idx] = a.payload;
        if (s.current?.id === a.payload.id) s.current = a.payload;
      })
      .addCase(removePayment.fulfilled, (s, a) => {
        s.list = s.list.filter(p => p.id !== a.payload);
        const totalItems = Math.max(0, s.meta.totalItems - 1);
        const pageSize = s.meta.pageSize || emptyMeta.pageSize;
        s.meta = {
          ...s.meta,
          totalItems,
          totalPages: Math.max(1, Math.ceil(totalItems / pageSize))
        };
      });
  }
});

export default slice.reducer;
