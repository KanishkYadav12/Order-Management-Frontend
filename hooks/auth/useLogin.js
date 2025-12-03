import { useState } from "react";
import { useDispatch } from "react-redux";
import { login } from "@/redux/actions/auth";

export const useLogin = () => {
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const handleLogin = async (loginData) => {
    setLoading(true);
    try {
      const success = await dispatch(login(loginData));
      setLoading(false);
      return success;
    } catch (error) {
      setLoading(false);
      return false;
    }
  };

  return { loading, handleLogin };
};
