/** Password policy shared by registration, password change and staff account creation. */
export const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,72}$/;
export const PASSWORD_MESSAGE =
  'Password must be 8–72 characters and include at least one letter and one number.';
export const BCRYPT_ROUNDS = 12;
