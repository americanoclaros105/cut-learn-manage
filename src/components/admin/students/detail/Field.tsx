import type { ReactNode } from 'react';
import { Label } from '@/components/ui/label';

interface FieldProps {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}

/** Label + control + inline validation message (announced to screen readers). */
export const Field = ({ id, label, error, hint, children }: FieldProps) => (
  <div className="space-y-2">
    <Label htmlFor={id}>{label}</Label>
    {children}
    {error ? (
      <p id={`${id}-error`} role="alert" className="text-sm text-destructive">
        {error}
      </p>
    ) : hint ? (
      <p id={`${id}-hint`} className="text-xs text-muted-foreground">
        {hint}
      </p>
    ) : null}
  </div>
);
