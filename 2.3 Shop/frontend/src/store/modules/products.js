import productService from '../../services/productService';

let fetchSequence = 0;

const state = {
  items: [],
  loading: false,
  error: '',
  pagination: null,
  summary: null,
};

const mutations = {
  SET_LOADING(currentState, value) {
    currentState.loading = value;
  },
  SET_ERROR(currentState, value) {
    currentState.error = value;
  },
  SET_ITEMS(currentState, items) {
    currentState.items = items;
  },
  SET_LIST_META(currentState, { pagination, summary }) {
    currentState.pagination = pagination;
    currentState.summary = summary;
  },
  ADD_ITEM(currentState, item) {
    currentState.items.unshift(item);
  },
  REPLACE_ITEM(currentState, item) {
    const index = currentState.items.findIndex((product) => product._id === item._id);
    if (index !== -1) currentState.items.splice(index, 1, item);
  },
  REMOVE_ITEM(currentState, id) {
    currentState.items = currentState.items.filter((product) => product._id !== id);
  },
};

const actions = {
  async fetchProducts({ commit }, options) {
    const sequence = ++fetchSequence;
    commit('SET_LOADING', true);
    commit('SET_ERROR', '');
    try {
      const { data } = await productService.list(options);
      const result = data.data || [];
      const items = Array.isArray(result) ? result : result.items || [];
      if (sequence === fetchSequence) {
        commit('SET_ITEMS', items);
        commit('SET_LIST_META', {
          pagination: Array.isArray(result) ? null : result.pagination || null,
          summary: Array.isArray(result) ? null : result.summary || null,
        });
      }
      return items;
    } catch (error) {
      if (sequence === fetchSequence) commit('SET_ERROR', error.response?.data?.message || 'โหลดสินค้าไม่สำเร็จ');
      throw error;
    } finally {
      if (sequence === fetchSequence) commit('SET_LOADING', false);
    }
  },
  async createProduct({ commit }, payload) {
    const { data } = await productService.create(payload);
    commit('ADD_ITEM', data.data);
    return data.data;
  },
  async updateProduct({ commit }, { id, payload }) {
    const { data } = await productService.update(id, payload);
    commit('REPLACE_ITEM', data.data);
    return data.data;
  },
  async deleteProduct({ commit }, id) {
    const { data } = await productService.remove(id);
    commit('REPLACE_ITEM', data.data);
    return data.data;
  },
  async restoreProduct({ commit }, id) {
    const { data } = await productService.restore(id);
    commit('REPLACE_ITEM', data.data);
    return data.data;
  },
};

export default {
  namespaced: true,
  state,
  getters: {
    products: (currentState) => currentState.items,
  },
  mutations,
  actions,
};
