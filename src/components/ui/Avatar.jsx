const COLORS = [
  'bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 'bg-blue-500',
  'bg-green-500', 'bg-amber-500', 'bg-teal-500', 'bg-rose-500',
]

function getColor(name = '') {
  const sum = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return COLORS[sum % COLORS.length]
}

function initials(firstName = '', lastName = '') {
  return `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase()
}

export default function Avatar({ firstName, lastName, size = 'md', className = '' }) {
  const sizes = { xs: 'w-5 h-5 text-xs', sm: 'w-7 h-7 text-xs', md: 'w-8 h-8 text-sm', lg: 'w-10 h-10 text-base' }
  const color = getColor(firstName + lastName)
  return (
    <div className={`${sizes[size]} rounded-full ${color} flex items-center justify-center text-white font-medium flex-shrink-0 ${className}`}>
      {initials(firstName, lastName)}
    </div>
  )
}
