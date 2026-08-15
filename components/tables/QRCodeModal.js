"use client";

import { useSelector } from "react-redux";
import { Download, Printer, Loader2, QrCode } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

/**
 * Shows a table's QR code, with print and download.
 *
 * The code arrives as a PNG data URL, so downloading is a plain anchor —
 * no PDF library, no popup, no canvas round-trip. The previous implementation
 * pulled in `html2pdf`, opened a second window and rebuilt the page inside it,
 * and called a `generateHtmlContent` helper it never imported.
 */
export default function QRCodeModal({ open, onOpenChange, qrLoading }) {
  const qrData = useSelector((state) => state.qr.getQr.data);

  const imageUrl = qrData?.imageUrl ?? qrData?.qrCodeImage?.imageUrl;
  const tableNumber = qrData?.tableNumber;

  const download = () => {
    if (!imageUrl) return;
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `table-${tableNumber ?? "qr"}-code.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();

    toast({
      title: "Downloaded",
      description: `Table ${tableNumber} QR code saved.`,
      variant: "success",
    });
  };

  const print = () => {
    if (!imageUrl) return;

    const frame = document.createElement("iframe");
    // Printing through a hidden iframe rather than window.open, so a popup
    // blocker can't silently swallow it.
    frame.style.position = "fixed";
    frame.style.right = "100%";
    frame.style.bottom = "100%";
    frame.setAttribute("aria-hidden", "true");
    document.body.appendChild(frame);

    const doc = frame.contentWindow.document;
    doc.open();
    doc.write(`<!doctype html><html><head><title>Table ${tableNumber}</title>
      <style>
        @page { size: A5 portrait; margin: 0; }
        * { box-sizing: border-box; }
        body {
          margin: 0; height: 100vh;
          display: flex; align-items: center; justify-content: center;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          -webkit-print-color-adjust: exact; print-color-adjust: exact;
        }
        .card {
          width: 118mm; padding: 14mm 10mm; text-align: center;
          border: 1.5mm solid #0f3d2e; border-radius: 6mm;
        }
        .hotel { font-size: 22pt; font-weight: 800; letter-spacing: -0.02em; color: #0f3d2e; margin: 0; }
        .table-no { margin: 3mm 0 8mm; font-size: 13pt; font-weight: 700; letter-spacing: .18em;
                    text-transform: uppercase; color: #4a5548; }
        img { width: 78mm; height: 78mm; object-fit: contain; }
        .call { margin: 8mm 0 0; font-size: 15pt; font-weight: 700; color: #0f3d2e; }
        .sub  { margin: 2mm 0 0; font-size: 10pt; color: #6b7280; }
      </style></head><body>
      <div class="card">
        <p class="hotel">${qrData?.hotelName ?? ""}</p>
        <p class="table-no">Table ${tableNumber ?? ""}</p>
        <img src="${imageUrl}" alt="QR code for table ${tableNumber}" />
        <p class="call">Scan to see the menu &amp; order</p>
        <p class="sub">Point your phone camera at the code</p>
      </div></body></html>`);
    doc.close();

    const cleanUp = () => setTimeout(() => frame.remove(), 500);
    const image = doc.querySelector("img");

    const go = () => {
      frame.contentWindow.focus();
      frame.contentWindow.print();
      cleanUp();
    };

    if (image?.complete) go();
    else {
      image.onload = go;
      image.onerror = () => {
        toast({
          title: "Couldn't print",
          description: "The QR image failed to load.",
          variant: "destructive",
        });
        cleanUp();
      };
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Table {tableNumber ?? ""} QR code</DialogTitle>
          <DialogDescription>
            Print this and place it on the table. Diners scan it to see the menu
            and order.
          </DialogDescription>
        </DialogHeader>

        {qrLoading || !imageUrl ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3 text-muted-foreground">
            {qrLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                <p className="text-sm">Generating…</p>
              </>
            ) : (
              <>
                <QrCode className="h-6 w-6" aria-hidden="true" />
                <p className="text-sm">No QR code available.</p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="mx-auto w-full max-w-[16rem] rounded-xl border-2 border-primary/25 bg-white p-4">
              {/* Plain <img>: the source is a data URL, which next/image
                  cannot optimise anyway. */}
              <img
                src={imageUrl}
                alt={`QR code for table ${tableNumber}`}
                className="h-auto w-full"
              />
            </div>

            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 rounded-lg bg-muted/50 p-3 text-sm">
              <dt className="text-muted-foreground">Restaurant</dt>
              <dd className="truncate font-medium">{qrData?.hotelName ?? "—"}</dd>
              <dt className="text-muted-foreground">Table</dt>
              <dd className="font-medium tabular">{tableNumber ?? "—"}</dd>
            </dl>

            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={download} className="gap-1.5">
                <Download className="h-4 w-4" aria-hidden="true" />
                Download
              </Button>
              <Button onClick={print} className="gap-1.5">
                <Printer className="h-4 w-4" aria-hidden="true" />
                Print
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
