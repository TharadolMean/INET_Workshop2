import api from './api';

const toFormData = (payload) => {
  if (payload instanceof FormData) return payload;

  const formData = new FormData();
  Object.entries(payload || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (key === 'image' && !(value instanceof File)) return;
      formData.append(key, value);
    }
  });
  return formData;
};

export default {
  list() {
    return api.get('/products');
  },
  get(id) {
    return api.get(`/products/${id}`);
  },
  create(payload) {
    return api.post('/products', toFormData(payload), { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  update(id, payload) {
    return api.put(`/products/${id}`, toFormData(payload), { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  remove(id) {
    return api.delete(`/products/${id}`);
  },
};
