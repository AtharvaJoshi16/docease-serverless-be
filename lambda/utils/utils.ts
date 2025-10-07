export const getFileExtension = (fileName: string) => {
  const splitted = fileName.split(".");
  console.log(splitted);
  return splitted[splitted.length - 1];
};
