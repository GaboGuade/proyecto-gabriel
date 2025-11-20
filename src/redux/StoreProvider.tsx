"use client";
import { store } from "@/redux/store";
import React, { type FC } from "react";
import { Provider } from "react-redux";

interface GlobalLayoutProps {
  children: React.ReactNode;
}

const StoreProvider: FC<GlobalLayoutProps> = ({ children }) => {
  return <Provider store={store}>{children}</Provider>;
};
export default StoreProvider;
