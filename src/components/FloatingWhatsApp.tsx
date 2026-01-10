import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface FloatingWhatsAppProps {
  phone: string;
  message: string;
}

export const FloatingWhatsApp = ({ phone, message }: FloatingWhatsAppProps) => {
  const handleClick = () => {
    const encodedMessage = encodeURIComponent(message);
    const cleanPhone = phone.replace(/\D/g, "");
    window.open(`https://api.whatsapp.com/send?phone=+${cleanPhone}&text=${encodedMessage}`, "_blank");
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={handleClick}
            size="icon"
            className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-green-500 hover:bg-green-600 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]"
            aria-label="Contactar por WhatsApp"
          >
            <i className="fab fa-whatsapp whatsapp-icon text-2xl text-white" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left" className="bg-green-600 text-white border-green-600">
          <p>¡Escríbenos!</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
