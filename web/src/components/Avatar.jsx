export default function Avatar({ user, large = false }) {
  const initial = (user?.username || '?').slice(0, 1).toUpperCase()

  return (
    <div className={`avatar ${large ? 'avatar-large' : ''}`} aria-hidden="true">
      <span>{initial}</span>
    </div>
  )
}
