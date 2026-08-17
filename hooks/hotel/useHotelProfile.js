"use client";

import { useState, useEffect, useCallback } from "react";
import api, { getErrorMessage } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

/**
 * The signed-in owner's own restaurant.
 *
 * `GET /hotels/me` resolves the hotel from the token, so nothing here needs a
 * hotel id passed down through props — which is what the previous redux hook
 * needed, and what made it re-fetch whenever the id arrived a render late.
 */
export const useHotelProfile = () => {
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get("/hotels/me");
      setHotel(data?.data?.hotel ?? data?.data ?? null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const update = async (changes) => {
    if (!hotel?._id) return { ok: false };
    setSaving(true);
    try {
      const { data } = await api.put(`/hotels/${hotel._id}`, changes);
      setHotel(data?.data?.hotel ?? { ...hotel, ...changes });
      toast({ title: "Saved", variant: "success" });
      return { ok: true };
    } catch (err) {
      toast({
        title: "Couldn't save that",
        description: getErrorMessage(err),
        variant: "destructive",
      });
      return { ok: false };
    } finally {
      setSaving(false);
    }
  };

  /**
   * Uploads one image and stores its URL against `field` in a single step.
   *
   * Two round trips, but the caller only sees one action — picking a photo and
   * having it stick is one intention, and splitting it into "upload" then
   * "remember to save" is how half-applied logos happen.
   */
  const uploadImage = async (field, file) => {
    if (!file) return { ok: false };

    if (!file.type?.startsWith("image/")) {
      toast({ title: "That file isn't an image", variant: "destructive" });
      return { ok: false };
    }
    // Matches the API's own cap, so the failure is caught before the upload.
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "That image is too large",
        description: "The limit is 5 MB.",
        variant: "destructive",
      });
      return { ok: false };
    }

    setSaving(true);
    try {
      const form = new FormData();
      form.append("logo", file);
      // The endpoint requires an allow-listed folder name; without it the
      // upload is rejected before it ever reaches storage.
      form.append("folderName", field === "banner" ? "banner" : "hotel");

      const { data } = await api.post("/uploads", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const url = data?.data?.url;
      if (!url) throw new Error("Upload returned no URL.");

      const { data: saved } = await api.put(`/hotels/${hotel._id}`, {
        [field]: url,
      });
      setHotel(saved?.data?.hotel ?? { ...hotel, [field]: url });

      toast({ title: "Photo updated", variant: "success" });
      return { ok: true, url };
    } catch (err) {
      toast({
        title: "Couldn't upload that",
        description: getErrorMessage(err),
        variant: "destructive",
      });
      return { ok: false };
    } finally {
      setSaving(false);
    }
  };

  return { hotel, loading, error, saving, refetch: load, update, uploadImage };
};

export default useHotelProfile;
