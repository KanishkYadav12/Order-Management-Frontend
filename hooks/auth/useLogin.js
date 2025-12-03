import { useState } from "react";
import { useDispatch } from "react-redux";
import { login } from "@/redux/actions/auth";

export const useLogin = () => {
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const handleLogin = async (loginData) => {
    setLoading(true);
    try {
      // Wrap dispatch in a promise to ensure it completes
      const result = await new Promise((resolve) => {
        const action = login(loginData);
        const promiseResult = dispatch(action);

        // If it's a promise (thunk), wait for it
        if (promiseResult && typeof promiseResult.then === "function") {
          promiseResult.then(resolve).catch(() => resolve(false));
        } else {
          // Otherwise resolve immediately
          resolve(promiseResult);
        }
      });

      setLoading(false);
      console.log("Login success:", result);
      return result;
    } catch (error) {
      console.error("Login error:", error);
      setLoading(false);
      return false;
    }
  };

  return { loading, handleLogin };
};
