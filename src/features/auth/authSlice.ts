import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  authApi,
  type LoginRequest,
  type InitRootAdminRequest,
  type CreateAdminRequest,
  type CreateSuperAdminRequest,
  type CreateUserRequest,
} from "../../services/authApi";

interface AuthState {
  user: string | null;
  userName: string | null;
  userRole: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

// Helper to decode JWT and extract user info
const decodeToken = (token: string) => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return {
      email: payload.sub,
      name: payload.name,
      role: payload.type,
    };
  } catch {
    return null;
  }
};

const initialState: AuthState = {
  user: null,
  userName: null,
  userRole: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

// Async thunks
export const loginAsync = createAsyncThunk(
  "auth/login",
  async (credentials: LoginRequest, { rejectWithValue }) => {
    try {
      const response = await authApi.login(credentials);
      if (response.success) {
        const token = response.data!.token;
        localStorage.setItem("token", token);
        const decoded = decodeToken(token);
        return { token, ...decoded };
      } else {
        return rejectWithValue(response.message);
      }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Login failed");
    }
  }
);

export const initRootAdminAsync = createAsyncThunk(
  "auth/initRootAdmin",
  async (data: InitRootAdminRequest, { rejectWithValue }) => {
    try {
      const response = await authApi.initRootAdmin(data);
      if (response.success) {
        return response.message;
      } else {
        return rejectWithValue(response.message);
      }
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create root admin"
      );
    }
  }
);

export const createAdminAsync = createAsyncThunk(
  "auth/createAdmin",
  async (data: CreateAdminRequest, { rejectWithValue }) => {
    try {
      const response = await authApi.createAdmin(data);
      if (response.success) {
        return response.message;
      } else {
        return rejectWithValue(response.message);
      }
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create admin"
      );
    }
  }
);

export const createSuperAdminAsync = createAsyncThunk(
  "auth/createSuperAdmin",
  async (data: CreateSuperAdminRequest, { rejectWithValue }) => {
    try {
      const response = await authApi.createSuperAdmin(data);
      if (response.success) {
        return response.message;
      } else {
        return rejectWithValue(response.message);
      }
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create super admin"
      );
    }
  }
);

export const createUserAsync = createAsyncThunk(
  "auth/createUser",
  async (data: CreateUserRequest, { rejectWithValue }) => {
    try {
      const response = await authApi.createUser(data);
      if (response.success) {
        return response.message;
      } else {
        return rejectWithValue(response.message);
      }
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create user"
      );
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.userName = null;
      state.userRole = null;
      state.isAuthenticated = false;
      state.error = null;
      localStorage.removeItem("token");
    },
    clearError(state) {
      state.error = null;
    },
    restoreSession(state) {
      const token = localStorage.getItem("token");
      if (token) {
        const decoded = decodeToken(token);
        if (decoded) {
          state.user = decoded.email;
          state.userName = decoded.name;
          state.userRole = decoded.role;
          state.isAuthenticated = true;
        } else {
          localStorage.removeItem("token");
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.email;
        state.userName = action.payload.name;
        state.userRole = action.payload.role;
        state.isAuthenticated = true;
      })
      .addCase(loginAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(initRootAdminAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(initRootAdminAsync.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(initRootAdminAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createAdminAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createAdminAsync.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(createAdminAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createUserAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createUserAsync.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(createUserAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { logout, clearError, restoreSession } = authSlice.actions;
export default authSlice.reducer;
