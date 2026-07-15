export default function Button({ children, onClick, type = "button", variant = "primary", className = "" }) {
  const base = "px-6 py-2.5 rounded-full font-semibold transition duration-200 ease-in-out text-sm shadow-md hover:shadow-lg disabled:opacity-50"
  const variants = {
    primary: "bg-gradient-to-r from-teal-500 to-cyan-600 text-white hover:from-teal-600 hover:to-cyan-700",
    outline: "border-2 border-white/60 text-white hover:bg-white/20 backdrop-blur-sm"
  }
  return (
    <button type={type} onClick={onClick} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </button>
  )
}