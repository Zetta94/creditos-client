import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  fetchClients as fetchClientsService,
  fetchClient as fetchClientService,
  createClient as createClientService,
  updateClient as updateClientService,
  deleteClient as deleteClientService
} from "../services/clientsService";

const emptyMeta = { page: 1, pageSize: 10, totalItems: 0, totalPages: 1 };

export const loadClients = createAsyncThunk("clients/loadAll", async (params = {}) => {
  const response = await fetchClientsService(params);
  return response.data;
});

export const loadClient = createAsyncThunk("clients/loadOne", async (id) => {
  const { data } = await fetchClientService(id);
  return data;
});

export const addClient = createAsyncThunk("clients/add", async (payload) => {
  const { data } = await createClientService(payload);
  return data;
});

export const saveClient = createAsyncThunk("clients/save", async ({ id, payload }) => {
  const { data } = await updateClientService(id, payload);
  return data;
});

export const removeClient = createAsyncThunk("clients/remove", async (id) => {
  await deleteClientService(id);
  return id;
});

const slice = createSlice({
  name: "clients",
  initialState: { list: [], meta: emptyMeta, current: null, loading: false, error: null },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(loadClients.pending, s => { s.loading = true; s.error = null; })
      .addCase(loadClients.fulfilled, (s, a) => {
        s.loading = false;
        s.list = a.payload?.data ?? [];
        s.meta = a.payload?.meta ?? emptyMeta;
      })
      .addCase(loadClients.rejected, (s, a) => {
        s.loading = false;
        s.error = a.error.message;
      })
      .addCase(loadClient.pending, s => { s.loading = true; s.error = null; })
      .addCase(loadClient.fulfilled, (s, a) => {
        s.loading = false;
        s.current = a.payload;
      })
      .addCase(loadClient.rejected, (s, a) => {
        s.loading = false;
        s.error = a.error.message;
      })
      .addCase(addClient.fulfilled, (s, a) => {
        s.list.unshift(a.payload);
        const totalItems = s.meta.totalItems + 1;
        const pageSize = s.meta.pageSize || emptyMeta.pageSize;
        s.meta = {
          ...s.meta,
          totalItems,
          totalPages: Math.max(1, Math.ceil(totalItems / pageSize))
        };
      })
      .addCase(saveClient.fulfilled, (s, a) => {
        const idx = s.list.findIndex(c => c.id === a.payload.id);
        if (idx !== -1) s.list[idx] = a.payload;
        if (s.current?.id === a.payload.id) s.current = a.payload;
      })
      .addCase(removeClient.fulfilled, (s, a) => {
        s.list = s.list.filter(c => c.id !== a.payload);
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
