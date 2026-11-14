export type WhatsAppItemType = 'producto' | 'servicio' | 'curso';

export const openWhatsApp = (
  phone: string,
  itemName: string,
  type: WhatsAppItemType
) => {
  const messages: Record<WhatsAppItemType, string> = {
    producto: `Hola! Me interesa el producto: ${itemName}. Me gustaría más información.`,
    servicio: `Hola! Me interesa el servicio: ${itemName}. Me gustaría reservar una cita.`,
    curso: `Hola! Me interesa el curso: ${itemName}. Me gustaría obtener más información.`,
  };

  const cleanPhone = phone.replace(/\D/g, '');
  const encodedMessage = encodeURIComponent(messages[type]);
  window.open(
    `https://api.whatsapp.com/send?phone=+${cleanPhone}&text=${encodedMessage}`,
    '_blank'
  );
};

/** Opens WhatsApp with a free-form message (used for support / payment follow-ups). */
export const openWhatsAppMessage = (phone: string, message: string) => {
  const cleanPhone = phone.replace(/\D/g, '');
  window.open(
    `https://api.whatsapp.com/send?phone=+${cleanPhone}&text=${encodeURIComponent(message)}`,
    '_blank'
  );
};
