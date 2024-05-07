import degit from 'degit';

export const clone = (
  repository = 'temporalio/samples-typescript',
  destination = './samples',
) => degit(repository).clone(destination);
