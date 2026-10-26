import { shallowMount } from '@vue/test-utils';
import ProductCard from '../../src/components/products/ProductCard.vue';

describe('ProductCard', () => {
  it('formats price and reads the legacy primary image field', () => {
    const wrapper = shallowMount(ProductCard, {
      propsData: { product: { _id: 'p1', name: 'Laptop', price: 1250, image: { path: '/uploads/laptop.png' } } },
      mocks: {
        $store: { getters: { 'auth/isAuthenticated': false, 'auth/currentUser': null } },
      },
      stubs: ['v-card', 'v-img', 'v-icon', 'v-chip', 'v-card-text', 'v-card-actions', 'v-btn', 'v-spacer'],
    });

    expect(wrapper.vm.formatPrice(1250)).toBe('1,250');
    expect(wrapper.vm.image).toBe('/uploads/laptop.png');
    expect(wrapper.vm.isCustomer).toBe(false);
    wrapper.destroy();
  });
});
