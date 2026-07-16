module.exports = (req, res, next) => {
  res.status(404).json({
    success: false,
    status: 'fail',
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};
