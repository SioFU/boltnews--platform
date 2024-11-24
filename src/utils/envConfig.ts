// Environment configuration types
export type Environment = 'development' | 'test' | 'production';

export interface EnvironmentConfig {
  showDetailedErrors: boolean;
  logToConsole: boolean;
  maskSensitiveData: boolean;
}

// Environment-specific configurations
export const ENV_CONFIG: Record<Environment, EnvironmentConfig> = {
  development: {
    showDetailedErrors: true,
    logToConsole: true,
    maskSensitiveData: false
  },
  test: {
    showDetailedErrors: false,
    logToConsole: true,
    maskSensitiveData: true
  },
  production: {
    showDetailedErrors: false,
    logToConsole: false,
    maskSensitiveData: true
  }
};

// Get current environment
export const getCurrentEnv = (): Environment => {
  try {
    const mode = import.meta.env.MODE;
    if (mode === 'production' || mode === 'development' || mode === 'test') {
      return mode;
    }
    return 'development'; // Default to development if mode is not recognized
  } catch {
    return 'development'; // Fallback to development if env is not available
  }
};
