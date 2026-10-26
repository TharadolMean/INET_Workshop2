import { shallowMount } from '@vue/test-utils';
import ProductForm from '../../src/components/products/ProductForm.vue';

const mountForm = (value = {}) => shallowMount(ProductForm, {
  propsData: { value },
  stubs: ['v-form', 'v-text-field', 'v-textarea', 'v-select', 'v-row', 'v-col', 'v-file-input', 'v-img', 'v-btn', 'v-icon', 'v-spacer', 'v-alert'],
});

describe('ProductForm', () => {
  it('serializes structured specifications with the product payload', () => {
    const wrapper = mountForm({ name: 'Laptop', price: 10, stock: 3 });
    wrapper.vm.$refs.form = { validate: () => true };
    wrapper.vm.specificationsText = 'Processor: 8-core\nMemory: 16 GB';

    wrapper.vm.submit();

    const payload = wrapper.emitted('submit')[0][0];
    expect(payload.specifications).toEqual([
      { name: 'Processor', value: '8-core' },
      { name: 'Memory', value: '16 GB' },
    ]);
    expect(payload.price).toBe(10);
    expect(payload.stock).toBe(3);
    wrapper.destroy();
  });

  it('rejects malformed specification lines before emitting a save', () => {
    const wrapper = mountForm();
    wrapper.vm.$refs.form = { validate: () => true };
    wrapper.vm.specificationsText = 'Processor has no separator';

    wrapper.vm.submit();

    expect(wrapper.vm.specificationsError).toContain('ชื่อและค่าคั่น');
    expect(wrapper.emitted('submit')).toBeUndefined();
    wrapper.destroy();
  });
});
