export const getNewPasswordChecks = (password) => {
  const value = password ?? '';
  return {
    minLength: Array.from(value).length >= 8,
    mixedCase: /\p{Lu}/u.test(value) && /\p{Ll}/u.test(value),
    number: /\p{N}/u.test(value),
    specialCharacter: /[^\p{L}\p{N}\s]/u.test(value),
    noTrailingSpace: Boolean(value) && !value.endsWith(' '),
  };
};

export const getNewPasswordIssue = (password) => {
  if (!password) return 'required';
  const checks = getNewPasswordChecks(password);
  if (!checks.minLength) return 'tooShort';
  if (!checks.noTrailingSpace) return 'trailingSpace';
  if (!checks.mixedCase) return 'mixedCase';
  if (!checks.number) return 'number';
  if (!checks.specialCharacter) return 'specialCharacter';
  return null;
};
