import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import { usersApi } from '../../api/users.api';
import { showToast } from '../../store/slices/uiSlice';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

export default function UserForm({ open, onClose, user, onSaved }) {
  const dispatch = useDispatch();
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

  useEffect(() => {
    if (open) {
      reset(user || {
        name: '',
        email: '',
        password: '',
        role: 'seller',
        is_active: true,
      });
    }
  }, [open, user, reset]);

  const onSubmit = async (data) => {
    try {
      if (user) {
        const { password, ...rest } = data;
        await usersApi.update(user.id, rest);
        dispatch(showToast({ type: 'success', message: 'Usuario actualizado' }));
      } else {
        await usersApi.create(data);
        dispatch(showToast({ type: 'success', message: 'Usuario creado' }));
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
      title={user ? 'Editar usuario' : 'Nuevo usuario'}
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Nombre completo *"
          {...register('name', { required: 'Requerido' })}
          error={errors.name?.message}
        />
        <Input
          label="Email *"
          type="email"
          {...register('email', { required: 'Requerido' })}
          error={errors.email?.message}
        />
        {!user && (
          <Input
            label="Contraseña *"
            type="password"
            {...register('password', {
              required: 'Requerido',
              minLength: { value: 8, message: 'Mínimo 8 caracteres' },
            })}
            error={errors.password?.message}
          />
        )}
        <div>
          <label className="label">Rol *</label>
          <select className="input" {...register('role')}>
            <option value="seller">Vendedor</option>
            <option value="supervisor">Supervisor</option>
            <option value="admin">Administrador</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="is_active" {...register('is_active')} className="rounded" />
          <label htmlFor="is_active" className="text-sm text-gray-700">Usuario activo</label>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" loading={isSubmitting}>
            {user ? 'Actualizar' : 'Crear usuario'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}