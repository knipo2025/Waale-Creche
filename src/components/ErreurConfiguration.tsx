export default function ErreurConfiguration({ message }: { message: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-papier px-6 text-center">
      <div className="max-w-sm rounded-card border border-wa-danger/20 bg-wa-danger/10 p-6">
        <p className="font-display font-semibold text-wa-danger">Erreur de configuration</p>
        <p className="mt-2 text-sm text-wa-danger">{message}</p>
      </div>
    </main>
  )
}
