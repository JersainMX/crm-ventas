import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import { clientsApi } from '../../api/clients.api';
import { showToast } from '../../store/slices/uiSlice';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

export default function ClientForm({ open, onClose, client, onSaved }) {
  const dispatch = useDispatch();
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

  useEffect(() => {
    if (open) {
      reset(client || {
        type: 'company',
        status: 'prospect',
        name: '',
        tax_id: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        country: '',
      });
    }
  }, [open, client, reset]);

  const onSubmit = async (data) => {
    try {
      if (client) {
        await clientsApi.update(client.id, data);
        dispatch(showToast({ type: 'success', message: 'Cliente actualizado' }));
      } else {
        await clientsApi.create(data);
        dispatch(showToast({ type: 'success', message: 'Cliente creado' }));
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
      title={client ? 'Editar cliente' : 'Nuevo cliente'}
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Tipo</label>
            <select className="input" {...register('type')}>
              <option value="company">Empresa</option>
              <option value="person">Persona</option>
            </select>
          </div>
          <div>
            <label className="label">Estado</label>
            <select className="input" {...register('status')}>
              <option value="prospect">Prospecto</option>
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
            </select>
          </div>
        </div>

        <Input
          label="Nombre *"
          {...register('name', { required: 'El nombre es requerido' })}
          error={errors.name?.message}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input label="RFC / NIT" {...register('tax_id')} />
          <Input label="Teléfono" {...register('phone')} />
        </div>

        <Input
          label="Email"
          type="email"
          {...register('email')}
        />

        <Input label="Dirección" {...register('address')} />

        <div className="grid grid-cols-2 gap-4">
          <Input label="Ciudad" {...register('city')} />
          <Input label="País" {...register('country')} />
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" loading={isSubmitting}>
            {client ? 'Actualizar' : 'Crear cliente'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}