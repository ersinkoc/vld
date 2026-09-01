// VLD v3.0 — React form example using vV2 (2-6x faster hot path) and
// toZodError (ZodError-shaped errors with .format() / .flatten()).
//
// Drop-in: replace `import { v } from '@oxog/vld'` with `import { vV2 } from
// '@oxog/vld'` for the V2 method-memoization path. Same surface.

import React, { useState } from 'react';
import { vV2, toZodError, ZodLikeError } from '@oxog/vld';

// Form schema using V2 classes — 2-6x faster than V1/Zod 4.5 on the hot path
const registrationSchema = vV2.object({
  username: vV2.string().min(3).max(20),
  email: vV2.string().email(),
  password: vV2.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
  confirmPassword: vV2.string(),
  age: vV2.number().int().min(18).max(120),
  terms: vV2.boolean()
});

// Per-field schemas for live blur validation
const fieldSchemas = {
  username: vV2.string().min(3).max(20),
  email: vV2.string().email(),
  password: vV2.string()
    .min(8)
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[0-9]/, 'Must contain number'),
  age: vV2.number().int().min(18).max(120)
};

function RegistrationForm() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    age: '',
    terms: false
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const validateField = (name, value) => {
    try {
      switch (name) {
        case 'username':
        case 'email':
        case 'password':
          fieldSchemas[name].parse(value);
          break;
        case 'confirmPassword':
          if (value !== formData.password) {
            throw new Error('Passwords do not match');
          }
          break;
        case 'age':
          fieldSchemas.age.parse(Number(value));
          break;
        case 'terms':
          if (!value) throw new Error('You must accept the terms');
          break;
      }
      return null;
    } catch (error) {
      return error.message;
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    if (error) {
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const dataToValidate = { ...formData, age: Number(formData.age) };
    const result = registrationSchema.safeParse(dataToValidate);

    if (!result.success) {
      // Use toZodError for ZodError-shaped errors with .flatten()
      const zodErr = toZodError(result.error);
      if (zodErr instanceof ZodLikeError) {
        const { fieldErrors } = zodErr.flatten();
        setErrors({ form: fieldErrors });
      } else {
        setErrors({ form: result.error.message });
      }
      setIsSubmitting(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrors({ confirmPassword: 'Passwords do not match' });
      setIsSubmitting(false);
      return;
    }

    if (!formData.terms) {
      setErrors({ terms: 'You must accept the terms' });
      setIsSubmitting(false);
      return;
    }

    try {
      console.log('Submitting:', result.data);
      alert('Registration successful!');
    } catch (error) {
      setErrors({ form: 'Registration failed. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="registration-form">
      <h2>Register</h2>

      {errors.form && (
        <div className="error-message">
          {typeof errors.form === 'string'
            ? errors.form
            : Object.entries(errors.form)
                .map(([field, errs]) => `${field}: ${(errs as string[]).join(', ')}`)
                .join('; ')}
        </div>
      )}

      <div className="form-group">
        <label htmlFor="username">Username</label>
        <input
          type="text" id="username" name="username"
          value={formData.username}
          onChange={handleChange} onBlur={handleBlur} required
        />
        {errors.username && <span className="error">{errors.username}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="email">Email</label>
        <input
          type="email" id="email" name="email"
          value={formData.email}
          onChange={handleChange} onBlur={handleBlur} required
        />
        {errors.email && <span className="error">{errors.email}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="password">Password</label>
        <input
          type="password" id="password" name="password"
          value={formData.password}
          onChange={handleChange} onBlur={handleBlur} required
        />
        {errors.password && <span className="error">{errors.password}</span>}
        <small>Min 8 chars, 1 uppercase, 1 number</small>
      </div>

      <div className="form-group">
        <label htmlFor="confirmPassword">Confirm Password</label>
        <input
          type="password" id="confirmPassword" name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange} onBlur={handleBlur} required
        />
        {errors.confirmPassword && <span className="error">{errors.confirmPassword}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="age">Age</label>
        <input
          type="number" id="age" name="age"
          value={formData.age}
          onChange={handleChange} onBlur={handleBlur} required
        />
        {errors.age && <span className="error">{errors.age}</span>}
      </div>

      <div className="form-group">
        <label>
          <input
            type="checkbox" name="terms"
            checked={formData.terms}
            onChange={handleChange}
          />
          I accept the terms and conditions
        </label>
        {errors.terms && <span className="error">{errors.terms}</span>}
      </div>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Registering...' : 'Register'}
      </button>
    </form>
  );
}

export default RegistrationForm;
