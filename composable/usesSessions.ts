import { ref } from 'vue';
import axiosInstance from "../interceptors/axiosInstance";

import axios from "axios";


export function useSessionsSetup() {

    const axiosInstance = axios.create({
        baseURL: '/api/', // ✅ now becomes '/api/'
    });

    const loading = ref(false);
    const error = ref(null);


    const postData = async (payload, token) => {
        loading.value = true;
        error.value = null;
        try {
            const response = await axiosInstance.post('sessions/', payload, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            loading.value = false;
            return response.data;
        } catch (err) {
            error.value = err.message || 'An error occurred';
            loading.value = false;
            throw err;
        }
    };


    // PUT update session by ID
    const editData = async (id, payload) => {
        loading.value = true;
        error.value = null;
        try {
            const response = await axiosInstance.put(`sessions/${id}`, payload);
            loading.value = false;
            return response.data;
        } catch (err) {
            error.value = err.message || 'An error occurred';
            loading.value = false;
            throw err;
        }
    };

    // GET sessions list with pagination and sorting
    const getData = async (access) => {
        loading.value = true;
        error.value = null;
        try {
            const response = await axiosInstance.get('sessions', {
                headers: {
                    Authorization: `Bearer ${access}`,  // Pass token here
                },
            });
            loading.value = false;
            return response.data;
        } catch (err) {
            error.value = err.message || 'An error occurred';
            loading.value = false;
            throw err;
        }
    };


    // GET all sessions without pagination (if supported)
    const getDataList = async () => {
        loading.value = true;
        error.value = null;
        try {
            const response = await axiosInstance.get('all'); // change if your API endpoint differs
            loading.value = false;
            return response.data;
        } catch (err) {
            error.value = err.message || 'An error occurred';
            loading.value = false;
            throw err;
        }
    };

    // DELETE session by ID
    const deleteData = async (id) => {
        loading.value = true;
        error.value = null;
        try {
            const response = await axiosInstance.delete(`sessions/${id}`);
            loading.value = false;
            return response.data;
        } catch (err) {
            error.value = err.message || 'An error occurred';
            loading.value = false;
            throw err;
        }
    };

    return {
        loading,
        error,
        postData,
        editData,
        getData,
        getDataList,
        deleteData,
    };
}
