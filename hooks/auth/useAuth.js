import { useSelector } from "react-redux";
import {
  selectCurrentUser,
  selectIsAuthenticated,
  selectBootstrapping,
  selectProfile,
} from "@/redux/slices/authSlice";
import { ROLES } from "@/config/config";

/**
 * Reads the current session.
 *
 * Two roles only. A super admin runs the platform and has no restaurant of
 * their own; an owner runs exactly one and can do everything inside it. That
 * distinction — `isSuperAdmin` — is what most of the UI actually branches on,
 * so `can()` exists mainly to keep call sites reading as intent ("can they
 * settle a bill") rather than as a role check.
 *
 * Redirects deliberately do not happen here: any component may ask who the
 * user is without that triggering navigation. Routing belongs to the guard.
 */
export const useAuth = () => {
  const currentUser = useSelector(selectCurrentUser);
  const profile = useSelector(selectProfile);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const bootstrapping = useSelector(selectBootstrapping);

  const user = profile ?? currentUser;
  const role = user?.role ?? null;
  const isSuperAdmin = role === ROLES.SUPER_ADMIN;
  const isOwner = role === ROLES.HOTEL_OWNER;

  return {
    user,
    role,
    hotelId: user?.hotelId ?? null,
    hotelName: user?.hotelName ?? null,
    isAuthenticated,
    /** True while the session restore is still in flight. */
    loading: bootstrapping,
    isSuperAdmin,
    isOwner,
    /** Both roles are fully privileged within their own scope. */
    can: () => isSuperAdmin || isOwner,
  };
};

export default useAuth;
