enum SessionStatus {
  pending,
  paired,
  connected,
  expired,
  closed;

  static SessionStatus parse(String raw) {
    return SessionStatus.values.firstWhere(
      (status) => status.name == raw,
      orElse: () => SessionStatus.pending,
    );
  }
}
