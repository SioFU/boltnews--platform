import ReactGA from 'react-ga4';

// 初始化 GA4
export const initGA = (measurementId: string) => {
  console.log('Initializing GA4 with measurement ID:', measurementId);
  try {
    ReactGA.initialize(measurementId);
    console.log('GA4 initialized successfully');
  } catch (error) {
    console.error('Failed to initialize GA4:', error);
  }
};

// 页面访问跟踪
export const logPageView = () => {
  try {
    const path = window.location.pathname;
    console.log('Logging pageview for path:', path);
    ReactGA.send({ hitType: "pageview", page: path });
    console.log('Pageview logged successfully');
  } catch (error) {
    console.error('Failed to log pageview:', error);
  }
};

// 事件跟踪
export const logEvent = (category: string, action: string, label?: string) => {
  try {
    console.log('Logging event:', { category, action, label });
    ReactGA.event({
      category,
      action,
      label
    });
    console.log('Event logged successfully');
  } catch (error) {
    console.error('Failed to log event:', error);
  }
};

// 用户行为跟踪
export const trackUserBehavior = {
  // 项目交互
  projectView: (projectId: string, projectName: string) => {
    try {
      console.log('Logging project view event:', { projectId, projectName });
      logEvent('Project', 'View', `${projectId}-${projectName}`);
      console.log('Project view event logged successfully');
    } catch (error) {
      console.error('Failed to log project view event:', error);
    }
  },
  projectLike: (projectId: string) => {
    try {
      console.log('Logging project like event:', { projectId });
      logEvent('Project', 'Like', projectId);
      console.log('Project like event logged successfully');
    } catch (error) {
      console.error('Failed to log project like event:', error);
    }
  },
  projectComment: (projectId: string) => {
    try {
      console.log('Logging project comment event:', { projectId });
      logEvent('Project', 'Comment', projectId);
      console.log('Project comment event logged successfully');
    } catch (error) {
      console.error('Failed to log project comment event:', error);
    }
  },

  // 用户认证
  userLogin: (method: string) => {
    try {
      console.log('Logging user login event:', { method });
      logEvent('User', 'Login', method);
      console.log('User login event logged successfully');
    } catch (error) {
      console.error('Failed to log user login event:', error);
    }
  },
  userSignup: (method: string) => {
    try {
      console.log('Logging user signup event:', { method });
      logEvent('User', 'Signup', method);
      console.log('User signup event logged successfully');
    } catch (error) {
      console.error('Failed to log user signup event:', error);
    }
  },

  // 搜索行为
  search: (query: string) => {
    try {
      console.log('Logging search event:', { query });
      logEvent('Search', 'Query', query);
      console.log('Search event logged successfully');
    } catch (error) {
      console.error('Failed to log search event:', error);
    }
  },

  // 分类浏览
  categoryView: (category: string) => {
    try {
      console.log('Logging category view event:', { category });
      logEvent('Category', 'View', category);
      console.log('Category view event logged successfully');
    } catch (error) {
      console.error('Failed to log category view event:', error);
    }
  },

  // 错误跟踪
  error: (errorMessage: string, errorCode?: string) => {
    try {
      console.log('Logging error event:', { errorMessage, errorCode });
      logEvent('Error', errorMessage, errorCode);
      console.log('Error event logged successfully');
    } catch (error) {
      console.error('Failed to log error event:', error);
    }
  }
};
