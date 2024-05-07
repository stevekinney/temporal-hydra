import { rm } from 'fs/promises';

export const clean = (directory = './samples') => {
  return rm(directory, {
    recursive: true,
  }).catch((error) => {
    console.error('Failed to remove directory:', error);
    process.exit(1);
  });
};
