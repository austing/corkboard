/**
 * PositionInputs Component
 *
 * Displays X and Y position input fields in a centered, two-column layout.
 * Used in scrap creation and editing forms.
 *
 * @example
 * ```tsx
 * <PositionInputs
 *   xValue={100}
 *   yValue={200}
 *   onChange={(field, value) => setPosition({...position, [field]: value})}
 *   idPrefix="create-scrap"
 * />
 * ```
 */

interface PositionInputsProps {
  /** Current X position value */
  xValue: number;
  /** Current Y position value */
  yValue: number;
  /** Change handler for position updates */
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** ID prefix for input elements (for label association) */
  idPrefix?: string;
}

export function PositionInputs({
  xValue,
  yValue,
  onChange,
  idPrefix = 'position',
}: PositionInputsProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="flex justify-center">
        <div className="relative w-32">
          <input
            type="number"
            name="x"
            id={`${idPrefix}-x`}
            value={xValue}
            onChange={onChange}
            min={0}
            max={999999}
            placeholder="X"
            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm px-3 py-2 border bg-gray-50 placeholder-gray-500"
          />
        </div>
      </div>

      <div className="flex justify-center">
        <div className="relative w-32">
          <input
            type="number"
            name="y"
            id={`${idPrefix}-y`}
            value={yValue}
            onChange={onChange}
            min={0}
            max={999999}
            placeholder="Y"
            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm px-3 py-2 border bg-gray-50 placeholder-gray-500"
          />
        </div>
      </div>
    </div>
  );
}
