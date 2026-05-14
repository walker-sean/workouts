import MesocycleControls from "./MesocycleControls"
import PlanList from "./PlanList"
import SettingsPanel from "./SettingsPanel"

export default function PlanTab() {
  return (
    <div className="plan-tab">
      <MesocycleControls />
      <PlanList />
      <SettingsPanel />
    </div>
  )
}
