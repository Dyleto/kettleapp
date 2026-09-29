import { CLIENT_ROUTES } from '@/shared/config/routes';
import { LuHouse, LuListChecks, LuHistory } from 'react-icons/lu';

export const CLIENT_NAV_ITEMS = [
  { to: CLIENT_ROUTES.today, label: "Aujourd'hui", icon: LuHouse, end: true },
  { to: CLIENT_ROUTES.program, label: 'Programme', icon: LuListChecks },
  { to: CLIENT_ROUTES.history, label: 'Historique', icon: LuHistory },
];
