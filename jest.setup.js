import '@testing-library/jest-dom'

// Mock pdfjs-dist to avoid ES module issues
jest.mock('pdfjs-dist', () => {
  return {
    GlobalWorkerOptions: {
      workerSrc: ''
    },
    getDocument: jest.fn().mockReturnValue({
      promise: Promise.resolve({
        numPages: 1,
        getPage: jest.fn().mockResolvedValue({
          getTextContent: jest.fn().mockResolvedValue({
            items: [{ str: 'Mock PDF text content' }]
          })
        }),
        destroy: jest.fn().mockResolvedValue(undefined)
      })
    })
  };
});