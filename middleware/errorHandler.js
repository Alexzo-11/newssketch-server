module.exports = (err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'Server Error';
  res.status(status).json({ message, stack: process.env.NODE_ENV === 'production' ? null : err.stack });
};