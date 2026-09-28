/**
 * Normaliza un rango de fechas con valores por defecto.
 * Si no se envían, por defecto es el mes actual.
 */
export const getDateRange = (from, to) => {
  const now = new Date();
  const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1);
  const defaultTo = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const fromDate = from ? new Date(from) : defaultFrom;
  const toDate = to ? new Date(to) : defaultTo;

  if (isNaN(fromDate) || isNaN(toDate)) {
    throw new Error('Formato de fecha inválido. Usa YYYY-MM-DD');
  }

  if (fromDate > toDate) {
    throw new Error('La fecha inicial no puede ser mayor a la final');
  }

  return { fromDate, toDate };
};

/**
 * Devuelve el primer y último día del mes actual.
 */
export const currentMonthRange = () => {
  const now = new Date();
  return {
    from: new Date(now.getFullYear(), now.getMonth(), 1),
    to: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
  };
};

/**
 * Devuelve el primer y último día del mes anterior.
 */
export const lastMonthRange = () => {
  const now = new Date();
  return {
    from: new Date(now.getFullYear(), now.getMonth() - 1, 1),
    to: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59),
  };
};