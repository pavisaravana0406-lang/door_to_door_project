import React from 'react';

export interface GIconProps {
  /** Google Material SymbolsRounded glyph name, e.g. "dashboard". */
  name: string;
  /** Pixel size (sets font-size). Defaults to 24. */
  size?: number;
  /** Filled glyph variant. Defaults to false (outlined). */
  filled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
}

/**
 * Google Material Symbols (Rounded) icon for the whole project.
 * Replaces the old raster JPG/PNG icons so every icon is a crisp vector
 * with a unified professional look. Sizing is driven by `size` (px);
 * colour comes from Tailwind text-* classes via `className`.
 */
export const GIcon: React.FC<GIconProps> = ({
  name,
  size = 24,
  filled = false,
  className = '',
  style,
  title,
}) => (
  <span
    className={`material-symbols-rounded gicon${filled ? ' gicon-filled' : ''} ${className}`}
    style={{ fontSize: size, ...style }}
    aria-hidden="true"
    title={title}
  >
    {name}
  </span>
);
