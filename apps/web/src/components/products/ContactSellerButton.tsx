// Messaging is built in Phase 4. Until then the button is visible but honestly disabled.
export function ContactSellerButton() {
  return (
    <button
      type="button"
      disabled
      title="Messaging is coming soon"
      className="w-full cursor-not-allowed rounded-full bg-slate-200 px-5 py-3 text-sm font-semibold text-slate-500"
    >
      Contact seller (coming soon)
    </button>
  )
}