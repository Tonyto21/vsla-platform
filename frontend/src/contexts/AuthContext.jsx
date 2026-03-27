import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = 'http://localhost:5000/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const response = await axios.get(`${API_URL}/auth/me`);
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { username, password });
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setToken(token);
      setUser(user);
      toast.success('Login successful!');
      return true;
    } catch (error) {
      toast.error(error.response?.data?.error || 'Login failed');
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
    toast.success('Logged out successfully');
  };

  const uploadPhoto = async (file) => {
    const formData = new FormData();
    formData.append('photo', file);
    
    try {
      const response = await axios.post(`${API_URL}/users/upload-photo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUser({ ...user, profile_photo: response.data.photo_url });
      toast.success('Photo uploaded successfully!');
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.error || 'Upload failed');
      throw error;
    }
  };

  const value = {
    user,
    login,
    logout,
    uploadPhoto,
    loading,
    isAuthenticated: !!token,
    isCBLAdmin: user?.role === 'cbl_admin',
    isGroupLeader: user?.role === 'group_leader',
    isMember: user?.role === 'member',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};