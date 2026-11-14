/** Triggers a browser download of a text file (client side, no server round trip). */
export const downloadTextFile = (filename: string, content: string, mime = 'text/csv;charset=utf-8'): void => {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
