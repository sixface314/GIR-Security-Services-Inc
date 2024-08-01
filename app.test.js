// File: __tests__/app.test.js
import { uploadReport } from '../src/app'; // Assuming app.js is in src directory
import { startQRCodeScan } from '../src/app';

jest.mock('gapi.auth.getToken', () => jest.fn());
jest.mock('html5Qrcode', () => ({
  Html5Qrcode: jest.fn().mockImplementation(() => ({
    start: jest.fn().mockResolvedValue(),
    stop: jest.fn().mockResolvedValue()
  }))
}));

describe('Google Drive Upload', () => {
  it('should upload a report successfully', async () => {
    gapi.auth.getToken.mockReturnValue({ access_token: 'mock-token' });
    fetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue({ id: 'mock-file-id' })
    });

    const reportContent = '<html><body><p>Test Report</p></body></html>';
    await uploadReport(reportContent);

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
      expect.any(Object)
    );
  });

  it('should handle errors during file upload', async () => {
    gapi.auth.getToken.mockReturnValue({ access_token: 'mock-token' });
    fetch.mockResolvedValueOnce({
      ok: false,
      statusText: 'Bad Request'
    });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const reportContent = '<html><body><p>Test Report</p></body></html>';
    await uploadReport(reportContent);

    expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
    expect(alert).toHaveBeenCalledWith('Failed to upload report');
    consoleSpy.mockRestore();
  });
});

describe('QR Code Scanning', () => {
  it('should start QR code scanning', async () => {
    const startSpy = jest.spyOn(html5Qrcode.prototype, 'start');
    await startQRCodeScan();
    expect(startSpy).toHaveBeenCalledTimes(1);
  });

  it('should handle errors during QR code scanning', async () => {
    const startSpy = jest.spyOn(html5Qrcode.prototype, 'start').mockRejectedValue(new Error('Camera error'));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await startQRCodeScan();

    expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
    expect(alert).toHaveBeenCalledWith('Failed to access camera for QR code scanning.');
    consoleSpy.mockRestore();
    startSpy.mockRestore();
  });
});
