import { createSlice, nanoid } from "@reduxjs/toolkit";

const today = new Date();
const fmt = d => new Date(d).toISOString();

const mockClients = [
  {
    id: nanoid(),
    name: "María López",
    dni: "29.345.112",
    phone: "+54 9 266 555-0123",
    address: "Av. Italia 123, SL",
    createdAt: fmt(new Date(today.getFullYear(), today.getMonth()-3, 12)),
    payerPercent: 92,
    tags: ["puntual", "recurrente"],
    credits: [
      {
        id: nanoid(),
        clientId: "",
        lender: "El Imperio S.R.L.",
        borrower: "María López",
        principal: 100000,
        multiplier: 4,
        legalRate: 0.05,
        totalToPay: 400000,
        paymentType: "transferencia",
        startDate: fmt(new Date(today.getFullYear(), today.getMonth()-3, 15)),
        dueDate: fmt(new Date(today.getFullYear(), today.getMonth()+1, 15)),
        paid: 320000,
        status: "vigente",
      },
    ],
  },
  {
    id: nanoid(),
    name: "Juan Pérez",
    dni: "35.987.441",
    phone: "+54 9 266 444-9876",
    address: "Belgrano 250, SL",
    createdAt: fmt(new Date(today.getFullYear(), today.getMonth()-1, 2)),
    payerPercent: 68,
    tags: ["atrasos"],
    credits: [
      {
        id: nanoid(),
        clientId: "",
        lender: "El Imperio S.R.L.",
        borrower: "Juan Pérez",
        principal: 150000,
        multiplier: 4.5,
        legalRate: 0.05,
        totalToPay: 675000,
        paymentType: "efectivo",
        startDate: fmt(new Date(today.getFullYear(), today.getMonth()-1, 3)),
        dueDate: fmt(new Date(today.getFullYear(), today.getMonth()+2, 3)),
        paid: 120000,
        status: "mora",
      },
    ],
  },
  {
    id: nanoid(),
    name: "Carolina Díaz",
    dni: "40.112.003",
    phone: "+54 9 261 333-1111",
    address: "Mendoza 100",
    createdAt: fmt(new Date(today.getFullYear(), today.getMonth()-6, 28)),
    payerPercent: 100,
    tags: ["excelente"],
    credits: [
      {
        id: nanoid(),
        clientId: "",
        lender: "El Imperio S.R.L.",
        borrower: "Carolina Díaz",
        principal: 200000,
        multiplier: 4,
        legalRate: 0.05,
        totalToPay: 800000,
        paymentType: "mp",
        startDate: fmt(new Date(today.getFullYear(), today.getMonth()-6, 29)),
        dueDate: fmt(new Date(today.getFullYear(), today.getMonth()-2, 29)),
        paid: 800000,
        status: "cancelado",
      },
    ],
  },
];

const slice = createSlice({
  name: "clients",
  initialState: { list: mockClients },
  reducers: {
    addClient: {
      prepare: (payload) => ({ payload: { ...payload, id: nanoid() } }),
      reducer: (state, action) => {
        const c = action.payload;
        state.list.unshift({ ...c, createdAt: fmt(new Date()), credits: c.credits || [] });
      }
    },
    // agregar reducers que uses luego (updateClient, addPayment, etc.)
  }
});

export const { addClient } = slice.actions;
export default slice.reducer;
