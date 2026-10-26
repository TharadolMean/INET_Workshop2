import api from './api';

export default {
  list() { return api.get('/wishlist'); },
  add(productId) { return api.post(`/wishlist/${productId}`); },
  remove(productId) { return api.delete(`/wishlist/${productId}`); },
};
