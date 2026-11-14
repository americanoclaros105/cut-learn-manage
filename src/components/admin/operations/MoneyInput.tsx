import { Input } from '@/components/ui/input';
import { formatMoneyInput, parseMoneyInput } from '@/lib/money';

interface MoneyInputProps {
  id?: string;
  /** Raw text shown in the input (already formatted). */
  value: string;
  onChange: (formatted: string, amount: number) => void;
  placeholder?: string;
  autoFocus?: boolean;
  'aria-invalid'?: boolean;
}

/** Text input for COP amounts with live thousands separators. */
export const MoneyInput = ({ value, onChange, ...props }: MoneyInputProps) => (
  <div className="relative">
    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden>
      $
    </span>
    <Input
      {...props}
      inputMode="numeric"
      value={value}
      onChange={(e) => onChange(formatMoneyInput(e.target.value), parseMoneyInput(e.target.value))}
      className="pl-7 tabular-nums"
    />
  </div>
);
