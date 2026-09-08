export default function ErreurConfiguration({ message }: { message: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-6 text-center">
      <div className="max-w-sm rounded-card border border-bad/20 bg-bad-bg p-6 shadow-card-soft">
        <p className="font-heading font-semibold text-bad">Erreur de configuration</p>
        <p className="mt-2 text-sm text-bad">{message}</p>
      </div>
    </main>
  )
}
