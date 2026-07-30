declare module 'pdfjs-dist/legacy/build/pdf.mjs' {
  export const getDocument: (source: { data: Uint8Array; disableWorker?: boolean }) => { promise: Promise<any> };
}
