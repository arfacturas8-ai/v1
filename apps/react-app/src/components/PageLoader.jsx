export default function PageLoader({ fullScreen = false }) {
  return (
    <div className={fullScreen ? 'fixed inset-0 flex items-center justify-center bg-gray-900 z-50' : 'flex items-center justify-center p-8'}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold animate-pulse">
          C
        </div>
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-300 text-sm">
          Loading...
        </p>
      </div>
    </div>
  )
}
