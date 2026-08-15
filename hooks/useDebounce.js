"use client";

import { useState, useEffect } from "react";

/**
 * Settles a fast-changing value before anything expensive reacts to it.
 *
 * Search boxes are the reason this exists: typing "chicken" against a raw
 * value fires seven requests, and whichever one the network happens to return
 * last wins. Debouncing the term means one request, for what the person
 * actually typed.
 */
export const useDebounce = (value, delay = 300) => {
  const [settled, setSettled] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return settled;
};

export default useDebounce;
