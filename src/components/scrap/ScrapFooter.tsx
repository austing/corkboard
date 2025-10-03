/**
 * ScrapFooter Component
 *
 * Displays author and creation date metadata for a scrap.
 * Used in both ScrapCard previews and modal views.
 *
 * @example
 * ```tsx
 * <ScrapFooter
 *   userName="John Doe"
 *   userEmail="john@example.com"
 *   createdAt={new Date()}
 *   size="small"
 * />
 * ```
 */

interface ScrapFooterProps {
  /** Author's display name (optional) */
  userName?: string | null;
  /** Author's email */
  userEmail: string;
  /** When the scrap was created */
  createdAt: Date | number;
  /** Size variant - small for cards, large for modals */
  size?: 'small' | 'large';
  /** Additional CSS classes */
  className?: string;
}

export function ScrapFooter({
  userName,
  userEmail,
  createdAt,
  size = 'small',
  className = '',
}: ScrapFooterProps) {
  const textSize = size === 'small' ? 'text-xs' : 'text-sm';
  const paddingClass = size === 'small' ? 'border-t pt-2' : '';

  return (
    <div className={`${textSize} text-gray-500 flex justify-between items-center ${paddingClass} ${className}`}>
      <div>{userName || userEmail}</div>
      <div>{new Date(createdAt).toLocaleDateString()}</div>
    </div>
  );
}
