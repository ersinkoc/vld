import React, { useState } from 'react';
import { v } from '@oxog/vld';

// Define form schema
const registrationSchema = v.object({
  username: v.string().min(3).max(20),
  email: v.string().email(),
  password: v.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
  confirmPassword: v.string(),
  age: v.number().int().min(18).max(120),
  terms: v.boolean()
});

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
    
    // Clear error for this field
    setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const validateField = (name, value) => {
    try {
      switch (name) {
        case 'username':
          v.string().min(3).max(20).parse(value);
          break;
        case 'email':
          v.string().email().parse(value);
          break;
        case 'password':
          v.string().min(8).regex(/[A-Z]/, 'Must contain uppercase').regex(/[0-9]/, 'Must contain number').parse(value);
          break;
        case 'confirmPassword':
          if (value !== formData.password) {
            throw new Error('Passwords do not match');
          }
          break;
        case 'age':
          v.number().int().min(18).max(120).parse(Number(value));
          break;
        case 'terms':
          if (!value) {
            throw new Error('You must accept the terms');
          }
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
    
    // Prepare data for validation
    const dataToValidate = {
      ...formData,
      age: Number(formData.age)
    };
    
    // Validate entire form
    const result = registrationSchema.safeParse(dataToValidate);
    
    if (!result.success) {
      // Show first error
      setErrors({ form: result.error.message });
      setIsSubmitting(false);
      return;
    }
    
    // Additional validation for password confirmation
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
    
    // Submit form
    try {
      console.log('Submitting:', result.data);
      // await submitToAPI(result.data);
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
        <div className="error-message">{errors.form}</div>
      )}
      
      <div className="form-group">
        <label htmlFor="username">Username</label>
        <input
          type="text"
          id="username"
          name="username"
          value={formData.username}
          onChange={handleChange}
          onBlur={handleBlur}
          required
        />
        {errors.username && <span className="error">{errors.username}</span>}
      </div>
      
      <div className="form-group">
        <label htmlFor="email">Email</label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          onBlur={handleBlur}
          required
        />
        {errors.email && <span className="error">{errors.email}</span>}
      </div>
      
      <div className="form-group">
        <label htmlFor="password">Password</label>
        <input
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          onBlur={handleBlur}
          required
        />
        {errors.password && <span className="error">{errors.password}</span>}
        <small>Min 8 chars, 1 uppercase, 1 number</small>
      </div>
      
      <div className="form-group">
        <label htmlFor="confirmPassword">Confirm Password</label>
        <input
          type="password"
          id="confirmPassword"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          onBlur={handleBlur}
          required
        />
        {errors.confirmPassword && <span className="error">{errors.confirmPassword}</span>}
      </div>
      
      <div className="form-group">
        <label htmlFor="age">Age</label>
        <input
          type="number"
          id="age"
          name="age"
          value={formData.age}
          onChange={handleChange}
          onBlur={handleBlur}
          required
        />
        {errors.age && <span className="error">{errors.age}</span>}
      </div>
      
      <div className="form-group">
        <label>
          <input
            type="checkbox"
            name="terms"
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