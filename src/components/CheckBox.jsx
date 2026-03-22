// Checkbox animado reutilizável
// Importado em HabitCard, Home urgentes, etc.

export function CheckBox({ done, onClick, inactive = false }) {
  return (
    <div
      className={`hcheck ${done ? 'done' : ''} ${inactive ? 'inactive' : ''}`}
      onClick={inactive ? undefined : onClick}
      title={inactive ? 'Não programado para hoje' : undefined}
    >
      {done && (
        <svg className="check-svg" viewBox="0 0 14 14">
          <path className="check-path" d="M2.5 7 L5.5 10.5 L11.5 4" />
        </svg>
      )}
    </div>
  )
}
