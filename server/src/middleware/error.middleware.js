function notFound(req, res) {
  res.status(404).json({ error: 'Not found.' });
}

function onError(err, req, res, next) {
  console.error(`[Error] ${req.method} ${req.originalUrl}:`, err);
  if (res.headersSent) {
    next(err);
    return;
  }
  const status = err.status || 500;
  res.status(status).json({ error: status === 500 ? (err.message || 'Server error.') : err.message });
}

module.exports = { notFound, onError };
