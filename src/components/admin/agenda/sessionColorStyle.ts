import type { CSSProperties } from 'react';

const hex = /^#[0-9a-f]{6}$/i;

/** Left border in the group color and a soft tint of it; neutral when the group has no valid color. */
export const sessionColorStyle = (color: string | null | undefined, cancelled: boolean): CSSProperties => {
  const valid = color && hex.test(color) ? color : null;
  return {
    borderLeftColor: valid ?? 'hsl(var(--muted-foreground))',
    backgroundColor: cancelled ? undefined : valid ? `${valid}1f` : 'hsl(var(--muted))',
  };
};
