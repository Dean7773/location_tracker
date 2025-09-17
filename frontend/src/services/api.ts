import axios, { AxiosInstance } from 'axios';
import { 
  User, 
  Location, 
  Track, 
  TrackWithPoints, 
  TrackUpload, 
  AuthResponse, 
  LoginForm, 
  RegisterForm,
  LocationForm 
} from '../types';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: '/api/v1',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Добавляем токен к каждому запросу
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Обрабатываем ошибки
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Прокси методы для совместимости
  get(url: string, config?: any) {
    return this.api.get(url, config);
  }

  post(url: string, data?: any, config?: any) {
    return this.api.post(url, data, config);
  }

  put(url: string, data?: any, config?: any) {
    return this.api.put(url, data, config);
  }

  delete(url: string, config?: any) {
    return this.api.delete(url, config);
  }

  // Аутентификация
  async register(data: RegisterForm): Promise<User> {
    const response = await this.api.post('/auth/register', data);
    return response.data;
  }

  async login(data: LoginForm): Promise<AuthResponse> {
    const response = await this.api.post('/auth/login', data, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.api.get('/auth/me');
    return response.data;
  }

  // Местоположения
  async getLocations(): Promise<Location[]> {
    const response = await this.api.get('/locations/');
    return response.data;
  }

  async getCurrentLocation(): Promise<Location> {
    const response = await this.api.get('/locations/current');
    return response.data;
  }

  async updateCurrentLocation(data: LocationForm): Promise<Location> {
    const response = await this.api.put('/locations/current', data);
    return response.data;
  }

  async createLocation(data: LocationForm): Promise<Location> {
    const response = await this.api.post('/locations/', data);
    return response.data;
  }

  // Треки
  async getTracks(): Promise<Track[]> {
    const response = await this.api.get('/tracks/');
    return response.data;
  }

  async getTrack(trackId: number): Promise<TrackWithPoints> {
    const response = await this.api.get(`/tracks/${trackId}`);
    return response.data;
  }

  async createTrack(data: { name: string; description?: string }): Promise<Track> {
    const response = await this.api.post('/tracks/', data);
    return response.data;
  }

  async uploadTrack(data: TrackUpload): Promise<Track> {
    const response = await this.api.post('/tracks/upload', data);
    return response.data;
  }

  async deleteTrack(trackId: number): Promise<void> {
    await this.api.delete(`/tracks/${trackId}`);
  }

  // Карты
  async getCurrentLocationMap(): Promise<string> {
    const response = await this.api.get('/maps/current-location');
    return response.data;
  }

  async getTrackMap(trackId: number): Promise<string> {
    const response = await this.api.get(`/maps/track/${trackId}`);
    return response.data;
  }

  async getTracksMap(): Promise<string> {
    const response = await this.api.get('/maps/tracks');
    return response.data;
  }

  async getLocationsMap(): Promise<string> {
    const response = await this.api.get('/maps/locations');
    return response.data;
  }
}

export const apiService = new ApiService();
export const api = apiService; 