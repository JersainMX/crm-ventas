import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import { productsApi } from '../../api/products.api';
import { showToast } from '../../store/slices/uiSlice';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

export default function ProductForm({ open, onClose, product, categories, onSaved }) {
  const dispatch = useDispatch();
  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm();

  const type = watch('type', 'product');

  useEffect(() => {
    if (open) {
      reset(product || {
        sku: '',
        name: '',
        description: '',
        type: 'product',
        category_id: '',
        price: 0,
        tax_rate: 16,
        stock: 0,
        is_active: true,
      });
    }
  }, [open, product, reset]);

  const onSubmit = async (data) => {
    const payload = {
      ...data,
      price: Number(data.price),
      tax_rate: Number(data.tax_rate),
      stock: Number(data.stock),
      category_id: data.category_id ? Number(data.category_id) : null,
    };

    try {
      if (product) {
        await productsApi.update(product.id, payload);
        dispatch(showToast({ type: 'success', message: 'Producto actualizado' }));
      } else {
        await productsApi.create(payload);
        dispatch(showToast({ type: 'success', message: 'Producto creado' }));
      }
      onClose();
      onSaved();
    } catch (err) {
      dispatch(showToast({
        type: 'error',
        message: err.response?.data?.message || 'Error al guardar',
      }));
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={product ? 'Editar producto' : 'Nuevo producto'}
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="SKU *"
            {...register('sku', { required: 'El SKU es requerido' })}
            error={errors.sku?.message}
          />
          <div>
            <label className="label">Tipo</label>
            <select className="input" {...register('type')}>
              <option value="product">Producto</option>
              <option value="service">Servicio</option>
            </select>
          </div>
        </div>

        <Input
          label="Nombre *"
          {...register('name', { required: 'El nombre es requerido' })}
          error={errors.name?.message}
        />

        <div>
          <label className="label">Descripción</label>
          <textarea
            className="input"
            rows={2}
            {...register('description')}
          />
        </div>

        <div>
          <label className="label">Categoría</label>
          <select className="input" {...register('category_id')}>
            <option value="">Sin categoría</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Precio *"
            type="number"
            step="0.01"
            {...register('price', {
              required: 'El precio es requerido',
              min: { value: 0, message: 'Debe ser ≥ 0' },
            })}
            error={errors.price?.message}
          />
          <Input
            label="IVA (%)"
            type="number"
            step="0.01"
            {...register('tax_rate')}
          />
        </div>

        {type === 'product' && (
          <Input
            label="Stock"
            type="number"
            {...register('stock')}
          />
        )}

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="is_active"
            {...register('is_active')}
            className="rounded"
          />
          <label htmlFor="is_active" className="text-sm text-gray-700">
            Producto activo
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" loading={isSubmitting}>
            {product ? 'Actualizar' : 'Crear producto'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}