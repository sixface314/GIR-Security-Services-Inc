// File: __tests__/app.test.js
import { uploadReport, startQRCodeScan } from '../src/app'; // Assuming app.js is in src directory

jest.mock('gapi.auth.getToken', () => jest.fn());
jest.mock('html5-qrcode', () => ({
  Html5Qrcode: jest.fn().mockImplementation(() => ({
    start: jest.fn().mockResolvedValue(),
    stop: jest.fn().mockResolvedValue()
  }))
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Google Drive Upload', () => {
  it('should upload a report successfully', async () => {
    gapi.auth.getToken.mockReturnValue({ access_token: 'mock-token' });
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue({ id: 'mock-file-id' })
    });

    const reportContent = '<html><body><p>Test Report</p></body></html>';
    await uploadReport(reportContent);

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer mock-token'
        }),
        body: expect.any(FormData)
      })
    );
  });

  it('should handle errors during file upload', async () => {
    gapi.auth.getToken.mockReturnValue({ access_token: 'mock-token' });
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      statusText: 'Bad Request'
    });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

    const reportContent = '<html><body><p>Test Report</p></body></html>';
    await uploadReport(reportContent);

    expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
    expect(alertSpy).toHaveBeenCalledWith('Failed to upload report');
    
    consoleSpy.mockRestore();
    alertSpy.mockRestore();
  });

  it('should handle null token from gapi.auth.getToken', async () => {
    gapi.auth.getToken.mockReturnValue(null);
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

    const reportContent = '<html><body><p>Test Report</p></body></html>';
    await uploadReport(reportContent);

    expect(alertSpy).toHaveBeenCalledWith('Not authenticated. Please sign in.');
    
    alertSpy.mockRestore();
  });
});

describe('QR Code Scanning', () => {
  it('should start QR code scanning', async () => {
    const startSpy = jest.spyOn(Html5Qrcode.prototype, 'start');
    await startQRCodeScan();
    expect(startSpy).toHaveBeenCalledTimes(1);
  });

  it('should handle errors during QR code scanning', async () => {
    const startSpy = jest.spyOn(Html5Qrcode.prototype, 'start').mockRejectedValue(new Error('Camera error'));
    const stopSpy = jest.spyOn(Html5Qrcode.prototype, 'stop');
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

    await startQRCodeScan();

    expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
    expect(alertSpy).toHaveBeenCalledWith('Failed to access camera for QR code scanning.');
    expect(stopSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
    alertSpy.mockRestore();
    startSpy.mockRestore();
    stopSpy.mockRestore();
  });

  it('should handle successful QR code scan', async () => {
    const mockQrCodeMessage = 'https://example.com/scanned';
    const html5QrcodeScanner = new Html5Qrcode('reader');
    html5QrcodeScanner.start.mockImplementation((_, __, success) => {
      success(mockQrCodeMessage);
    });

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const stopSpy = jest.spyOn(Html5Qrcode.prototype, 'stop');

    await startQRCodeScan();

    expect(consoleSpy).toHaveBeenCalledWith('QR Code scanned:', mockQrCodeMessage);
    expect(stopSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
    stopSpy.mockRestore();
  });
});
