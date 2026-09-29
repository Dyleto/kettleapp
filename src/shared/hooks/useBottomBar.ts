import { useEffect, useSyncExternalStore } from 'react';

/**
 * The bottom of the screen has one slot, and it is claimed.
 *
 * Below 768 px the tab bar is fixed to the bottom. When the editor failed to
 * save, its "Modifications non enregistrées" line stacked on top: two fixed
 * bars on 390 px, and an invitation to navigate elsewhere while work is
 * unsaved.
 *
 * Rather than offsetting one above the other, the failure line takes the tab
 * bar's place for as long as it lasts. That is also truer on the substance:
 * there is nothing to go and see elsewhere while what you just wrote has not
 * left.
 *
 * A module registry rather than a context: the slot is unique in the app, the
 * tab bar lives in the layout and its potential occupant five levels below.
 * Making them talk through a provider would mean crossing the whole tree for
 * one boolean.
 */
let claimed = false;
const subscribers = new Set<() => void>();

const publish = (value: boolean) => {
  if (value === claimed) return;
  claimed = value;
  subscribers.forEach((notify) => notify());
};

const subscribe = (notify: () => void) => {
  subscribers.add(notify);
  return () => {
    subscribers.delete(notify);
  };
};

/** For layout: is anyone occupying the bottom of the screen? */
export const useBottomBarClaimed = () =>
  useSyncExternalStore(
    subscribe,
    () => claimed,
    () => false
  );

/**
 * For the occupant: claims the slot while `active`, and gives it back on the
 * way out. Unmounting releases it too — otherwise leaving the workshop while
 * a save has failed would leave the coach with no navigation.
 */
export const useClaimBottomBar = (active: boolean) => {
  useEffect(() => {
    publish(active);
    return () => publish(false);
  }, [active]);
};
