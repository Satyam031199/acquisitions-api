export const cookies = {
  getOptions: () => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 1000 * 60 * 15,
  }),
  set: (res, name, value, options = {}) => {
    res.cookie(name, value, { ...options, ...cookies.getOptions() });
  },
  getCookie: (req, name) => {
    return req.cookies[name];
  },
  clear: (res, name, options = {}) => {
    res.clearCookie(name, { ...options, ...cookies.getOptions() });
  },
};
