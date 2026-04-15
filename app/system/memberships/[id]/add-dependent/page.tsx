import AddDependentForm from '../@modal/(.)add-dependent/page'

export default function AddDependentPageFallback({ params }: { params: Promise<{ id: string }> }) {
  // We simply reuse the exact same form from the intercepted route, 
  // but it will render as a full page if someone hits refresh manually.
  return (
    <div className="page-container" style={{ display: 'flex', justifyContent: 'center', paddingTop: '4rem' }}>
       {/* Note: The component inside (.)add-dependent naturally renders a Modal wrapper. 
           For a real enterprise app, we'd extract the form logic, but this fallback protects against 404s. */}
       <AddDependentForm params={params} />
    </div>
  )
}
