import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  fetchClients as fetchClientsService,
  fetchClient as fetchClientService,
  createClient as createClientService,
  updateClient as updateClientService,
  deleteClient as deleteClientService
} from "../services/clientsService";

export const loadClients = createAsyncThunk("clients/loadAll", async () => {
  const { data } = await fetchClientsService();
  return data;
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
  initialState: { list: [], current: null, loading: false, error: null },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(loadClients.pending, s => { s.loading = true; s.error = null; })
      .addCase(loadClients.fulfilled, (s, a) => {
        s.loading = false;
        s.list = a.payload;
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
      .addCase(addClient.fulfilled, (s, a) => { s.list.unshift(a.payload); })
      .addCase(saveClient.fulfilled, (s, a) => {
        const idx = s.list.findIndex(c => c.id === a.payload.id);
        if (idx !== -1) s.list[idx] = a.payload;
        if (s.current?.id === a.payload.id) s.current = a.payload;
      })
      .addCase(removeClient.fulfilled, (s, a) => {
        s.list = s.list.filter(c => c.id !== a.payload);
      });
  }
});

export default slice.reducer;
