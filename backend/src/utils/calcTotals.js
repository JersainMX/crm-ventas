/**
 * Calcula los totales de una lista de items.
 * @param {Array} items - [{ quantity, unit_price, tax_rate, discount }]
 * @param {number} globalDiscount - descuento global a nivel cotización
 */
export const calcTotals = (items, globalDiscount = 0) => {
  let subtotal = 0;
  let taxTotal = 0;

  const detailedItems = items.map((it) => {
    const qty = Number(it.quantity) || 0;
    const price = Number(it.unit_price) || 0;
    const disc = Number(it.discount) || 0;
    const taxRate = Number(it.tax_rate) ?? 16;

    const lineSubtotal = qty * price - disc;
    const lineTax = lineSubtotal * (taxRate / 100);
    const lineTotal = lineSubtotal + lineTax;

    subtotal += lineSubtotal;
    taxTotal += lineTax;

    return {
      ...it,
      line_total: Number(lineTotal.toFixed(2)),
    };
  });

  const disc = Number(globalDiscount) || 0;
  const total = subtotal + taxTotal - disc;

  return {
    items: detailedItems,
    subtotal: Number(subtotal.toFixed(2)),
    tax_total: Number(taxTotal.toFixed(2)),
    discount: Number(disc.toFixed(2)),
    total: Number(total.toFixed(2)),
  };
};