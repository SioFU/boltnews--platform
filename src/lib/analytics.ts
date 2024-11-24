import ReactGA from 'react-ga4';

// 初始化 GA4
export const initGA = (measurementId: string) => {
  ReactGA.initialize(measurementId);
};

// 页面访问跟踪
export const logPageView = () => {
  ReactGA.send({ hitType: "pageview", page: window.location.pathname });
};

// 事件跟踪
export const logEvent = (category: string, action: string, label?: string) => {
  ReactGA.event({
    category,
    action,
    label
  });
};

// 用户行为跟踪
export const trackUserBehavior = {
  // 项目交互
  projectView: (projectId: string, projectName: string) => {
    logEvent('Project', 'View', `${projectId}-${projectName}`);
  },
  projectLike: (projectId: string) => {
    logEvent('Project', 'Like', projectId);
  },
  projectComment: (projectId: string) => {
    logEvent('Project', 'Comment', projectId);
  },

  // 用户认证
  userLogin: (method: string) => {
    logEvent('User', 'Login', method);
  },
  userSignup: (method: string) => {
    logEvent('User', 'Signup', method);
  },

  // 搜索行为
  search: (query: string) => {
    logEvent('Search', 'Query', query);
  },

  // 分类浏览
  categoryView: (category: string) => {
    logEvent('Category', 'View', category);
  },

  // 错误跟踪
  error: (errorMessage: string, errorCode?: string) => {
    logEvent('Error', errorMessage, errorCode);
  }
};
