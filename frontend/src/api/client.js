import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api',
  timeout: 120000,
  headers: { 'Content-Type': 'application/json' },
});

export async function generateImage(payload) {
  const { data } = await apiClient.post('/generate', payload);
  return data;
}

export async function listImages({ limit = 12, offset = 0 } = {}) {
  const { data } = await apiClient.get('/images', { params: { limit, offset } });
  return data;
}

export async function getImage(id) {
  const { data } = await apiClient.get(`/images/${id}`);
  return data;
}

export async function deleteImage(id) {
  const { data } = await apiClient.delete(`/images/${id}`);
  return data;
}

export async function enhancePrompt(prompt) {
  const { data } = await apiClient.post('/enhance-prompt', { prompt });
  return data;
}

export async function checkHealth() {
  const { data } = await apiClient.get('/health');
  return data;
}

export default apiClient;
