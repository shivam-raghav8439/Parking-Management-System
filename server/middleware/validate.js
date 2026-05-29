import { validationResult } from 'express-validator';

/**
 * Validator wrapper middleware. Intercepts validation outcomes from express-validator.
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation error: please check input fields.',
      errors: errors.array()
    });
  }
  next();
};
export default validate;
