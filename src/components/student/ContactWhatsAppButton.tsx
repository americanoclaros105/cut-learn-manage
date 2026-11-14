import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLandingContent } from '@/hooks/useLandingContent';
import { openWhatsAppMessage } from '@/lib/whatsapp';

interface ContactWhatsAppButtonProps {
  message: string;
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

/** Renders nothing when the academy has no WhatsApp number configured. */
export const ContactWhatsAppButton = ({ message, size = 'default', className }: ContactWhatsAppButtonProps) => {
  const { data: content } = useLandingContent();
  const phone = content?.contact?.whatsapp;
  if (!phone) return null;

  return (
    <Button
      type="button"
      variant="outline"
      size={size}
      className={className}
      onClick={(e) => {
        e.stopPropagation();
        openWhatsAppMessage(phone, message);
      }}
    >
      <MessageCircle className="w-4 h-4 mr-2" />
      Contactar por WhatsApp
    </Button>
  );
};
