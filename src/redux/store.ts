import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./features/auth/authSlice";
import categorySlice from "./features/category/categorySlice";
import searchSlice from "./features/search/searchSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    category: categorySlice,
    search: searchSlice,
  },
  devTools: process.env.NODE_ENV === "production" ? false : true,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
