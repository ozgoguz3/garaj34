export default function AdminLoading() {
  return (
    <div className="flex flex-col gap-5">
      <div className="skeleton h-28 rounded-2xl" />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_360px]">
        <div className="skeleton h-64 rounded-2xl" />
        <div className="skeleton h-64 rounded-2xl" />
      </div>
    </div>
  )
}