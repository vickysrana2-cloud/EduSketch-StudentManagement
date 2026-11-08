"use client";

import React, { useEffect } from "react";
import { Provider } from "react-redux";
import { store } from "@/store/store";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setTheme } from "@/store/slices/uiSlice";

function ThemeSync({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const theme = useAppSelector((state) => state.ui.theme);

  // 1. Initial hydration from localStorage / prefers-color-scheme
  useEffect(() => {
    try {
      const savedTheme = (localStorage.getItem("sms_theme") || localStorage.getItem("theme")) as "light" | "dark" | null;
      if (savedTheme === "dark" || savedTheme === "light") {
        dispatch(setTheme(savedTheme));
        if (savedTheme === "dark") {
          document.documentElement.classList.add("dark");
          document.body.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
          document.body.classList.remove("dark");
        }
      } else {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        const initialTheme = prefersDark ? "dark" : "light";
        dispatch(setTheme(initialTheme));
        if (prefersDark) {
          document.documentElement.classList.add("dark");
          document.body.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
          document.body.classList.remove("dark");
        }
      }
    } catch {
      // ignore localStorage access errors
    }
  }, [dispatch]);

  // 2. React to theme changes from toggleTheme or setTheme
  useEffect(() => {
    if (typeof document === "undefined") return;

    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      document.body.classList.add("dark");
      try {
        localStorage.setItem("sms_theme", "dark");
        localStorage.setItem("theme", "dark");
      } catch {}
    } else {
      document.documentElement.classList.remove("dark");
      document.body.classList.remove("dark");
      try {
        localStorage.setItem("sms_theme", "light");
        localStorage.setItem("theme", "light");
      } catch {}
    }
  }, [theme]);

  return <>{children}</>;
}

export function ReduxProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <ThemeSync>{children}</ThemeSync>
    </Provider>
  );
}
