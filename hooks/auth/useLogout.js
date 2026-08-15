import { useState } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { logout } from "@/redux/actions/auth/authAction";
import { useToast } from "@/hooks/use-toast";

/**
 * Signs the user out.
 *
 * The old flow called `localStorage.clear()` and then
 * `window.location.href = "/"`, which wiped unrelated keys and forced a full
 * page reload. It also never told the server, so the refresh token stayed
 * valid for its whole 30-day life. This revokes the session server-side and
 * navigates client-side.
 */
export const useLogout = () => {
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = async ({ allDevices = false } = {}) => {
    setLoading(true);
    await dispatch(logout({ allDevices }));
    setLoading(false);

    toast({
      title: "Signed out",
      description: allDevices
        ? "You've been signed out on every device."
        : "See you next time.",
    });

    router.replace("/login");
  };

  return { loading, handleLogout };
};

export default useLogout;
