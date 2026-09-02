export default function ErreurConfiguration({ message }: { message: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 text-center">
      <div className="max-w-sm rounded-xl border border-red-200 bg-red-50 p-6">
        <p className="font-semibold text-red-800">Erreur de configuration</p>
        <p className="mt-2 text-sm text-red-700">{message}</p>
      </div>
    </main>
  )
}
