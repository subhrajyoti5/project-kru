function notFound(req, res) {
  res.status(404).json({ error: 'Not found.' });
}

function onError(err, req, res, next) {
  if (res.headersSent) {
    next(err);
    return;
  }
  const status = err.status || 500;
  res.status(status).json({ error: status === 500 ? 'Server error.' : err.message });
}

module.exports = { notFound, onError };
