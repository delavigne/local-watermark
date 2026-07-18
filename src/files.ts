// Contextual action register inside Files View
declare const OCA: any;
declare const OC: any;

document.addEventListener('DOMContentLoaded', () => {
  if (typeof OCA !== 'undefined' && OCA.Files && OCA.Files.fileActions) {
    OCA.Files.fileActions.registerAction({
      name: 'localwatermark',
      displayName: 'Ajouter un filigrane',
      mime: 'application/pdf',
      permissions: 1, // READ
      iconClass: 'icon-clippy',
      actionHandler: (fileName: string, context: any) => {
        const fileList = context.fileList;
        const fileUrl = fileList.getDownloadUrl(fileName);
        const currentDir = fileList.getCurrentDirectory();
        
        const appUrl = OC.generateUrl('/apps/localwatermark/') + 
          `?file=${encodeURIComponent(fileName)}&url=${encodeURIComponent(fileUrl)}&dir=${encodeURIComponent(currentDir)}`;
        window.location.href = appUrl;
      }
    });
  }
});
