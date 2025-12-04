import api from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { getActionErrorMessage } from "@/utils";
import { QrActions } from "@/redux/slices/qrSlice";

// Get QR for a table
export const getQr = (tableId, setQrLoading) => async (dispatch) => {
  try {
    setQrLoading(tableId);

    const response = await api.get(`/qrs/${tableId}`, {
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    });

    dispatch(QrActions.getQrSuccess(response.data));

    toast({
      title: "Success",
      description: "QR Code details fetched successfully",
      variant: "success",
    });

  } catch (error) {
    console.log("action-get-qr-error:", error);
    dispatch(QrActions.getQrFailure(getActionErrorMessage(error)));

    toast({
      title: "Failed",
      description: getActionErrorMessage(error),
      variant: "destructive",
    });

  } finally {
    setQrLoading(null);
  }
};


// Print QR Action
export const printQr = (tableId, setQrLoading) => async (dispatch) => {
  try {
    setQrLoading(tableId);

    const response = await api.get(`/qrs/${tableId}`, {
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    });

    const { qrCodeImage, tableNumber, hotelName } = response.data;

    const printWindow = window.open('', '_blank', 'width=800,height=600');

    printWindow.document.write(
      generateHtmlContent(qrCodeImage.imageUrl, tableId, tableNumber, hotelName)
    );

    // Wait for the image to load
    await new Promise((resolve, reject) => {
      const img = printWindow.document.querySelector('img');
      if (img.complete) resolve();
      img.onload = resolve;
      img.onerror = reject;
    });

    // Add print + screen styles
    const style = printWindow.document.createElement('style');
    style.textContent = `
      @page {
          size: 148mm 210mm; 
          margin: 0;
      }
      @media print {
          html, body { 
              width: 148mm;
              height: 210mm;
              margin: 0;
              padding: 0;
          }
          body { 
              background: linear-gradient(135deg, rgb(255, 204, 128), rgb(255, 87, 34), rgb(255, 138, 101)) !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
          }
          .container { 
              box-shadow: none !important;
              width: 148mm !important;
              max-width: none !important;
              background-color: white !important;
              margin: 0 auto !important;
              padding: 10mm !important;
          }
          .button-container { display: none; }
      }
      @media screen {
          .button-container {
              position: fixed;
              top: 20px;
              right: 20px;
              display: flex;
              gap: 10px;
          }
          .action-button {
              padding: 10px 20px;
              border: none;
              border-radius: 5px;
              cursor: pointer;
              font-size: 16px;
              display: flex;
              align-items: center;
              gap: 8px;
              transition: all 0.2s;
          }
          .print-button {
              background: #4CAF50;
              color: white;
          }
          .print-button:hover { background: #45a049; }
          .download-button {
              background: #2196F3;
              color: white;
          }
          .download-button:hover { background: #1976D2; }
      }
    `;
    printWindow.document.head.appendChild(style);

    const buttonContainer = printWindow.document.createElement('div');
    buttonContainer.className = 'button-container';

    // Print button
    const printButton = printWindow.document.createElement('button');
    printButton.className = 'action-button print-button';
    printButton.innerHTML = '🖨️ Print QR Code';
    printButton.onclick = () => {
      const newStyle = printWindow.document.createElement('style');
      newStyle.textContent = `
          @page {
              size: A5 portrait;
              margin: 0;
          }
      `;
      printWindow.document.head.appendChild(newStyle);
      printWindow.print();
      printWindow.document.head.removeChild(newStyle);
    };

    // Download PDF button
    const downloadButton = printWindow.document.createElement('button');
    downloadButton.className = 'action-button download-button';
    downloadButton.innerHTML = '⬇️ Download PDF';
    downloadButton.onclick = async () => {
      const html2pdf = (await import('html2pdf.js')).default;

      buttonContainer.style.display = 'none';

      const element = printWindow.document.querySelector('.container');
      const parentBody = element.parentElement;

      const originalBodyStyle = parentBody.style.cssText;

      parentBody.style.cssText = `
          background: linear-gradient(135deg, rgb(255, 204, 128), rgb(255, 87, 34), rgb(255, 138, 101));
          min-height: 210mm;
          width: 148mm;
          margin: 0;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
      `;

      element.style.cssText = `
          width: 128mm;
          background-color: white;
          border-radius: 15px;
          padding: 10mm;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
          text-align: center;
          margin: 0 auto;
      `;

      const qrImage = element.querySelector('img');
      qrImage.style.width = '80mm';
      qrImage.style.height = '80mm';
      qrImage.style.objectFit = 'contain';

      const opt = {
        margin: 0,
        filename: `table-${tableNumber}-qr.pdf`,
        image: { type: 'jpeg', quality: 1 },
        html2canvas: { scale: 4, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a5', orientation: 'portrait' },
      };

      try {
        await html2pdf().from(parentBody).set(opt).save();
      } finally {
        parentBody.style.cssText = originalBodyStyle;
        qrImage.style.cssText = '';
        buttonContainer.style.display = 'flex';
      }
    };

    buttonContainer.appendChild(printButton);
    buttonContainer.appendChild(downloadButton);
    printWindow.document.body.appendChild(buttonContainer);

    printWindow.document.close();
    printWindow.focus();

    toast({
      title: "Success",
      description: "QR Code ready for printing or download",
      variant: "success",
    });

    setQrLoading(null);

  } catch (error) {
    console.log("action-download-error:", error);
    setQrLoading(null);

    toast({
      title: "Failed",
      description: getActionErrorMessage(error),
      variant: "destructive",
    });
  }
};
