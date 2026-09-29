import { COACH_ROUTES } from '@/shared/config/routes';
import { LuUsers, LuDumbbell } from 'react-icons/lu';

export const COACH_NAV_ITEMS = [
  { to: COACH_ROUTES.clients, label: 'Mes clients', icon: LuUsers, end: true },
  { to: COACH_ROUTES.exercises, label: 'Bibliothèque', icon: LuDumbbell },
];
