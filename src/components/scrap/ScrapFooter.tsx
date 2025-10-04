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
  userEmail?: string | null;
  /** When the scrap was created */
  createdAt?: Date | number | null;
  /** When the scrap was last modified */
  updatedAt?: Date | number | null;
  /** Size variant - small for cards, large for modals */
  size?: 'small' | 'large';
  /** Additional CSS classes */
  className?: string;
}

export function ScrapFooter({
  userName,
  userEmail,
  createdAt,
  updatedAt,
  size = 'small',
  className = '',
}: ScrapFooterProps) {
  const textSize = size === 'small' ? 'text-xs' : 'text-sm';
  const paddingClass = size === 'small' ? 'border-t pt-2' : '';

  // Use updatedAt if available, otherwise fall back to createdAt
  const displayDate = updatedAt || createdAt;

  // If no data is available (redacted for invisible scraps), don't show footer
  if (!userEmail && !userName && !displayDate) {
    return null;
  }

  const authorName = userName || userEmail || '';

  // Format date with time in 24-hour format
  const formatDateTime = (date: Date | number) => {
    const d = new Date(date);
    const dateStr = d.toLocaleDateString();
    const timeStr = d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    return `${dateStr} ${timeStr}`;
  };

  return (
    <div className={`${textSize} text-gray-500 flex justify-between items-center ${paddingClass} ${className}`}>
      <div>{authorName}</div>
      <div>{displayDate ? formatDateTime(displayDate) : ''}</div>
    </div>
  );
}
