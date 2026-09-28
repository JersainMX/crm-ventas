import { useEffect, useState } from 'react';
import { Plus, Mail, Phone, MapPin, Trash2 } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { clientsApi } from '../../api/clients.api';
import { showToast } from '../../store/slices/uiSlice';
import { formatDate } from '../../utils/format';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Spinner from '../../components/common/Spinner';
import Badge from '../../components/common/Badge';

export default function ClientDetail({ clientId }) {
  const dispatch = useDispatch();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', position: '', email: '', phone: '' });

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await clientsApi.getById(clientId);
      setClient(data.data);
    } catch (err) {
      dispatch(showToast({ type: 'error', message: 'Error al cargar detalle' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [clientId]);

  const handleAddContact = async () => {
    if (!newContact.name) return;
    try {
      await clientsApi.createContact(clientId, newContact);
      dispatch(showToast({ type: 'success', message: 'Contacto agregado' }));
      setNewContact({ name: '', position: '', email: '', phone: '' });
      setAdding(false);
      load();
    } catch (err) {
      dispatch(showToast({ type: 'error', message: 'Error al agregar contacto' }));
    }
  };

  const handleDeleteContact = async (contactId) => {
    try {
      await clientsApi.deleteContact(clientId, contactId);
      dispatch(showToast({ type: 'success', message: 'Contacto eliminado' }));
      load();
    } catch (err) {
      dispatch(showToast({ type: 'error', message: 'Error al eliminar' }));
    }
  };

  if (loading) return <Spinner />;
  if (!client) return <p>Cliente no encontrado</p>;

  return (
    <div className="space-y-6">
      {/* Info principal */}
      <div>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-800">{client.name}</h3>
            <div className="mt-1 flex items-center gap-2">
              <Badge status={client.status} />
              <span className="text-xs text-gray-500">
                {client.type === 'company' ? 'Empresa' : 'Persona'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Mail className="w-4 h-4 text-gray-400" />
            {client.email || 'Sin email'}
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Phone className="w-4 h-4 text-gray-400" />
            {client.phone || 'Sin teléfono'}
          </div>
          <div className="flex items-center gap-2 text-gray-600 col-span-2">
            <MapPin className="w-4 h-4 text-gray-400" />
            {[client.address, client.city, client.country].filter(Boolean).join(', ') || 'Sin dirección'}
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          Registrado el {formatDate(client.created_at)}
        </p>
      </div>

      {/* Contactos */}
      <div className="pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-gray-700">Contactos ({client.contacts?.length || 0})</h4>
          <Button
            variant="secondary"
            onClick={() => setAdding(!adding)}
            className="!py-1.5 !px-3 text-xs"
          >
            <Plus className="w-3 h-3" />
            Agregar
          </Button>
        </div>

        {adding && (
          <div className="bg-gray-50 rounded-lg p-4 mb-3 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Nombre *"
                value={newContact.name}
                onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
              />
              <Input
                placeholder="Cargo"
                value={newContact.position}
                onChange={(e) => setNewContact({ ...newContact, position: e.target.value })}
              />
              <Input
                placeholder="Email"
                value={newContact.email}
                onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
              />
              <Input
                placeholder="Teléfono"
                value={newContact.phone}
                onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setAdding(false)}>Cancelar</Button>
              <Button onClick={handleAddContact}>Guardar</Button>
            </div>
          </div>
        )}

        {client.contacts?.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Sin contactos registrados</p>
        ) : (
          <div className="space-y-2">
            {client.contacts?.map((contact) => (
              <div
                key={contact.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800">{contact.name}</p>
                  <p className="text-xs text-gray-500">
                    {contact.position} {contact.email && `· ${contact.email}`}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteContact(contact.id)}
                  className="p-1.5 hover:bg-red-100 text-red-600 rounded-md"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}