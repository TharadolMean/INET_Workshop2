import api from './api';

export default {
  list(params = {}) {
    return api.get('/users', { params });
  },
  approve(id) {
    return api.put(`/users/${id}/approve`);
  },
};
