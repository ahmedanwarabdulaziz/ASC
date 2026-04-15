import { getSystemSettings } from '@/features/settings/actions'
import SettingsForm from './SettingsForm'

export default async function SettingsPage() {
  const settings = await getSystemSettings()
  
  // Safe extraction with default fallbacks
  const minorMaxAge = settings['age_limits']?.minor_max_age || 21
  const seasonalPeriods = settings['seasonal_periods'] || {
    season_1_start: '', season_1_end: '',
    season_2_start: '', season_2_end: ''
  }
  
  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">الإعدادات العامة | General Settings</h1>
      </div>
      <SettingsForm minorMaxAge={minorMaxAge} seasonalPeriods={seasonalPeriods} />
    </div>
  )
}
