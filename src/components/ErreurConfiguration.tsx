export default function ErreurConfiguration({ message }: { message: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-papier px-6 text-center">
      <div className="max-w-sm rounded-card border border-critique-50 bg-critique-50 p-6">
        <p className="font-display font-semibold text-critique-700">Erreur de configuration</p>
        <p className="mt-2 text-sm text-critique-600">{message}</p>
      </div>
    </main>
  )
}
