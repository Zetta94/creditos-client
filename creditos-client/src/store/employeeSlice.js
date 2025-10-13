// src/store/cobradorSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { mockCobradorClientes, mockClients } from "../mocks/mockData";

export const fetchClientesCobrador = createAsyncThunk(
  "cobrador/fetchClientes",
  async (tipoPago) => {
    // simulamos fetch al backend
    const clientesAsignados = mockCobradorClientes
      .filter((c) => c.tipoPago === tipoPago)
      .sort((a, b) => a.orden - b.orden)
      .map((rel) => ({
        ...rel,
        ...mockClients.find((cl) => cl.id === rel.clienteId),
      }));

    return clientesAsignados;
  }
);

const cobradorSlice = createSlice({
  name: "cobrador",
  initialState: {
    clientes: [],
    loading: false,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchClientesCobrador.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchClientesCobrador.fulfilled, (state, action) => {
        state.loading = false;
        state.clientes = action.payload;
      })
      .addCase(fetchClientesCobrador.rejected, (state) => {
        state.loading = false;
      });
  },
});

export default cobradorSlice.reducer;
