function notFound(req, res) {
  res.status(404).json({ error: 'Not found.' });
}

function onError(err, req, res, next) {
  const status = err.status || 500;
  if (status >= 500) {
    console.error(`[Error] ${req.method} ${req.originalUrl}:`, err);
  } else {
    console.error(`[Error] ${req.method} ${req.originalUrl}: ${err.message}`);
  }
  if (res.headersSent) {
    next(err);
    return;
  }
  res.status(status).json({ error: status === 500 ? (err.message || 'Server error.') : err.message });
}

module.exports = { notFound, onError };
