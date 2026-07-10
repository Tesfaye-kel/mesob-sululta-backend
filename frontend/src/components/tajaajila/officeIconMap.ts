import {
  IdCard,
  Droplets,
  HeartPulse,
  GraduationCap,
  Store,
  Car,
  Map,
  Wheat,
  Shield,
  Banknote,
  Wallet,
  HardHat,
  Building2,
  Gavel,
  TreePine,
  Landmark,
  Users,
  Truck,
  type LucideIcon,
} from 'lucide-react'

const iconMap: Record<string, LucideIcon> = {
  // Civil registration
  galmeessa: IdCard,
  sivilii: IdCard,
  civil: IdCard,
  // Water
  bishaan: Droplets,
  water: Droplets,
  // Health
  fayyaa: HeartPulse,
  health: HeartPulse,
  // Education
  barnoota: GraduationCap,
  education: GraduationCap,
  // Trade
  daldala: Store,
  trade: Store,
  // Transport
  geejjiba: Car,
  geejiba: Car,
  transport: Car,
  // Land / Cadastral
  lafa: Map,
  kaadastara: Map,
  land: Map,
  // Agriculture
  qonna: Wheat,
  agriculture: Wheat,
  // Police
  poolisii: Shield,
  police: Shield,
  // Revenue / Tax
  galii: Banknote,
  revenue: Banknote,
  // Finance
  maallaqa: Wallet,
  finance: Wallet,
  // Construction
  konistraakshinii: HardHat,
  konistiraakshinii: HardHat,
  construction: HardHat,
  // Investment
  inveestimantii: Landmark,
  investment: Landmark,
  // Social / Labour
  hawaasummaa: Users,
  social: Users,
  // Environment
  naannoo: TreePine,
  environment: TreePine,
  // Legal / Prosecution
  alangaa: Gavel,
  legal: Gavel,
  // Housing
  manneen: Building2,
  housing: Building2,
  // Cooperative
  chuo: Users,
  // Logistics
  logistics: Truck,
}

export function getOfficeIcon(name: string): LucideIcon {
  const lower = name.toLowerCase()
  for (const [key, icon] of Object.entries(iconMap)) {
    if (lower.includes(key)) return icon
  }
  return Building2
}
