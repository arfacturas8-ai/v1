const ComingSoonBadge = ({ feature, description, icon: Icon, color = 'purple' }) => {
  const colorMap = {
    purple: '#a371f7',
    blue: '#58a6ff',
    green: '#00D4AA',
    orange: '#FF6B35'
  }

  const accentColor = colorMap[color] || colorMap.purple

  return (
    <div className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 rounded-xl shadow-2xl p-4 relative overflow-hidden">
      <div className="flex items-center gap-3 mb-2">
        {Icon && <Icon size={20} style={{ color: accentColor }} />}
        <span className="text-white text-base font-semibold flex-1">{feature}</span>
        <span className="px-3 py-1 rounded-full text-xs font-bold text-white" style={{ background: `linear-gradient(to right, ${accentColor}, ${accentColor}dd)` }}>
          Coming Soon
        </span>
      </div>
      {description && (
        <p className="text-gray-300 text-sm m-0 leading-relaxed">{description}</p>
      )}
    </div>
  )
}

export default ComingSoonBadge