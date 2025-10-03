/**
 * ErrorMessage Component
 *
 * Displays an error message banner at the top of the screen.
 *
 * @example
 * ```tsx
 * <ErrorMessage message="Failed to load scraps" />
 * ```
 */

interface ErrorMessageProps {
  /** The error message to display */
  message: string;
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  if (!message) return null;

  return (
    <div className="fixed top-4 left-4 right-4 p-4 bg-red-50 border border-red-200 rounded-md" style={{ zIndex: 998 }}>
      <p className="text-red-800">{message}</p>
    </div>
  );
}
