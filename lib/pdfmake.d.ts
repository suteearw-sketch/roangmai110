declare module 'pdfmake/build/pdfmake.js' {
 const pdfMake:{addVirtualFileSystem:(fonts:Record<string,string>)=>void;createPdf:(document:unknown,layouts?:unknown,fonts?:unknown)=>{getBuffer:(callback:(bytes:Uint8Array)=>void)=>void}};
 export default pdfMake;
}
