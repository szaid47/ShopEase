import { create } from 'zustand';
import axios from '../lib/axios.js';
import { toast } from 'react-hot-toast';

export const useUserStore = create((set, get) => ({
    user: null,
    loading: false,
    checkingAuth: true,

    signup: async ({ name, email, password, confirmPassword }) => {
        set({ loading: true });
        if (password !== confirmPassword) {
            set({ loading: false });
            return toast.error("Passwords do not match");
        }
        try {
            const res = await axios.post("/auth/signup", { name, email, password });
            set({ user: res.data, loading: false });
            toast.success("Signup successful!");
        } catch (err) {
            set({ loading: false });
            const message = err.response?.data?.message || "Something went wrong during signup.";
            toast.error(message);
            console.error("Signup Error:", err);
        }
    },

    login: async (email, password) => {
        set({ loading: true });
        try {
            const res = await axios.post("/auth/login", { email, password });
            set({ user: res.data, loading: false });
            toast.success("Login successful!");
        } catch (err) {
            set({ loading: false });
            const message = err.response?.data?.message || "Invalid credentials or an error occurred.";
            toast.error(message);
            console.error("Login Error:", err);
        }
    },

    checkAuth: async () => {
        set({ checkingAuth: true });
        try {
            const response = await axios.get("/auth/profile");
            set({ user: response.data, checkingAuth: false });
        } catch (error) {
            set({ checkingAuth: false, user: null });
            const message = error.response?.status === 404
                ? "Profile not found. Please log in again."
                : error.message || "Failed to fetch authentication status.";
            console.error("Auth Check Error:", error);
            toast.error(message);
        }
    },
}));
