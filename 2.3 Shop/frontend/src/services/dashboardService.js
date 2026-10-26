import api from './api';

export default {
  getOverview(filters = {}) {
    return api.get('/admin/dashboard', { params: filters });
  },
};
