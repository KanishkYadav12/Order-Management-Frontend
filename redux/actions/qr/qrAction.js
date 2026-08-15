import api, { getErrorMessage } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { QrActions } from "@/redux/slices/qrSlice";

/**
 * Loads a table's QR code.
 *
 * The API answers with the standard `{ status, message, data }` envelope, so
 * the payload is `response.data.data`. Storing the whole envelope is what put
 * `qrCodeImage` a level deeper than the modal read it, and produced
 * "Cannot read properties of undefined (reading 'imageUrl')".
 */
export const getQr = (tableId, setQrLoading) => async (dispatch) => {
  try {
    setQrLoading?.(tableId);
    dispatch(QrActions.getQrRequest());

    const { data } = await api.get(`/qrs/${tableId}`);
    dispatch(QrActions.getQrSuccess(data?.data ?? null));

    return { ok: true, data: data?.data };
  } catch (error) {
    const message = getErrorMessage(error);
    dispatch(QrActions.getQrFailure(message));

    toast({
      title: "Couldn't load the QR code",
      description: message,
      variant: "destructive",
    });

    return { ok: false };
  } finally {
    setQrLoading?.(null);
  }
};

export default getQr;
