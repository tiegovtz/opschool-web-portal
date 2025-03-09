/**
 * @description This file provides centralized feedback messages for the application.
 * @author Minja Baraka (https://github.com/MinjaBaraka)
 * @version 1.0.0
 * @since 1.0.0
 */

const messages = {
    success: {
      // Authentication related success messages
      auth: {
        authenticated: "Successfully logged in",
        registered: "Account successfully created",
        passwordReset: "Password has been reset successfully",
        passwordChanged: "Password has been changed successfully",
        emailVerified: "Email has been verified successfully",
        loggedOut: "You have been logged out successfully"
      },
      
      // User profile related success messages
      profile: {
        updated: "Profile updated successfully",
        pictureUploaded: "Profile picture uploaded successfully",
        settingsSaved: "Settings saved successfully"
      },
      
      // Form submission success messages
      form: {
        submitted: "Form submitted successfully",
        saved: "Data saved successfully",
      },
      
      // Data operations success messages
      data: {
        created: "Item created successfully",
        updated: "Item updated successfully",
        deleted: "Item deleted successfully",
        imported: "Data imported successfully",
        exported: "Data exported successfully"
      }
    },
  
    error: {
      // Authentication related error messages
      auth: {
        invalidCredentials: "Invalid username or password",
        accountLocked: "Your account has been locked. Please contact support",
        emailNotVerified: "Please verify your email before logging in",
        passwordMismatch: "Passwords do not match",
        weakPassword: "Password is too weak",
        accountExists: "An account with this email already exists",
        tokenExpired: "Your session has expired. Please log in again"
      },

      // Password Strength
      passwordStrength: {
        hasUppercase: "At least one uppercase letter",
        hasLowercase: "At least one lowercase letter",
        hasNumber: "At least one number",
        hasSpecialChar: "At least one special character",
        hasMinLength: "At least 8 characters",
      },
      
      // Form validation error messages
      validation: {
        required: "This field is required",
        invalidEmail: "Please enter a valid email address",
        invalidPhone: "Please enter a valid phone number",
        invalidFormat: "Invalid format",
        minLength: "Must be at least {min} characters",
        maxLength: "Cannot exceed {max} characters"
      },
      
      // Server error messages
      server: {
        connectionFailed: "Connection to server failed",
        timeout: "Request timed out",
        internalError: "Internal server error",
        maintenance: "System is under maintenance"
      },
      
      // Permission error messages
      permission: {
        denied: "You don't have permission to perform this action",
        unauthorized: "Unauthorized access"
      },
      
      // Data operation error messages
      data: {
        notFound: "Item not found",
        alreadyExists: "This item already exists",
        deleteError: "Could not delete item",
        saveError: "Could not save data"
      },

    //   Form Error
    form: {
        allInputs: "Fill username and password",
        all: "All Fields are required",
        invalid: "User does not exist",
        usernameValid: "Username is not valid (use email or phone number)",
        passwordValid: "Password is not valid",
        usernameRequired: "Username is required",
        passwordRequired: "Password is required",
        firstName: "First Name should have at least three characters",
        lastName: "Last Name should have at least three characters",
        confirmPassword: "Password Mismatch",
        role: "User role is required",
        gender: "User gender is required",
        region: "Region is required",
        isMinLength: " Name must be at least 3 characters long",
        hasSpecialChars: "Name should not contain special characters or numbers", 
        hasRepeatedChars: "Name should not have three or more repeating characters" 
    }
    },
  
    info: {
      // General information messages
      general: {
        loading: "Loading, please wait...",
        processing: "Processing your request...",
        confirmAction: "Are you sure you want to proceed?"
      },
      
      // Authentication related info messages
      auth: {
        passwordResetSent: "Password reset instructions sent to your email",
        verificationSent: "Verification email has been sent",
        sessionExpiring: "Your session will expire soon"
      },
      
      // Feature related info messages
      feature: {
        comingSoon: "This feature will be available soon",
        beta: "This feature is in beta",
        deprecated: "This feature will be deprecated soon"
      }
    },
  
    warning: {
      // Action warnings
      action: {
        deleteConfirmation: "This action cannot be undone",
        unsavedChanges: "You have unsaved changes",
        leavePage: "Are you sure you want to leave? Changes may not be saved"
      },
      
      // System warnings
      system: {
        lowStorage: "You're running out of storage space",
        slowConnection: "You're on a slow connection",
        browserUnsupported: "Your browser may not support all features"
      }
    }
  };
  
  export default messages;