/**
 * API客户端配置
 * 统一配置axios实例和请求拦截器
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { message } from 'antd';

// API基础配置
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// 创建axios实例
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
apiClient.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    // 在这里可以添加认证token等
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    
    return config;
  },
  (error) => {
    console.error('请求错误:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // 直接返回完整的响应对象，让调用方处理data
    return response;
  },
  (error) => {
    console.error('响应错误:', error);
    
    // 统一错误处理
    const errorMessage = error.response?.data?.message || error.message || '请求失败';
    
    // 根据状态码进行不同处理
    switch (error.response?.status) {
      case 400:
        message.error(`请求错误: ${errorMessage}`);
        break;
      case 401:
        message.error('未授权，请重新登录');
        // 可以在这里处理登录跳转
        break;
      case 403:
        message.error('拒绝访问');
        break;
      case 404:
        message.error('请求的资源不存在');
        break;
      case 500:
        message.error('服务器内部错误');
        break;
      default:
        message.error(errorMessage);
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;