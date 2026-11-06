import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { User } from "@/types";
import { setAccessToken, clearAccessToken } from "@/lib/auth-session";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  isLoading: boolean;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isInitialized: false,
  isLoading: false,
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
      state.isInitialized = true;
    },
    setSession: (
      state,
      action: PayloadAction<{ user: User; accessToken: string }>
    ) => {
      state.user = action.payload.user;
      state.isAuthenticated = true;
      state.isInitialized = true;
      state.isLoading = false;
      // Access token stored in memory only
      setAccessToken(action.payload.accessToken);
    },
    setToken: (state, action: PayloadAction<string | null>) => {
      setAccessToken(action.payload);
      if (!action.payload) {
        state.isAuthenticated = false;
        state.user = null;
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setInitialized: (state, action: PayloadAction<boolean>) => {
      state.isInitialized = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.isInitialized = true;
      state.isLoading = false;
      clearAccessToken();
    },
  },
});

export const {
  setUser,
  setSession,
  setToken,
  setLoading,
  setInitialized,
  logout,
} = authSlice.actions;

export default authSlice.reducer;
