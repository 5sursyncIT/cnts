export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 bg-zinc-200 rounded-md"></div>
        <div className="h-10 w-32 bg-zinc-200 rounded-md"></div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-6 rounded-xl border border-zinc-200 bg-white shadow-sm space-y-2">
             <div className="h-4 w-24 bg-zinc-200 rounded-md"></div>
             <div className="h-8 w-12 bg-zinc-200 rounded-md"></div>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid gap-6 md:grid-cols-2">
         <div className="h-64 bg-zinc-100 rounded-xl border border-zinc-200"></div>
         <div className="h-64 bg-zinc-100 rounded-xl border border-zinc-200"></div>
      </div>
    </div>
  )
}
