export const isMinLength = (val: string, minLength: number) => {
  return val.length >= minLength;
};

export const isMaxLength = (val: string, maxLength: number) => {
  return val.length <= maxLength;
};

export const isHandicap = (value: string | number): boolean => {
  const valStr = String(value);

  const regex = /^[+-]?\d+(?:\.(?:25|5|75))?$/;

  if (!regex.test(valStr)) return false;

  const num = parseFloat(valStr);

  if (num < -10 || num > 10) return false;

  return true;
};
