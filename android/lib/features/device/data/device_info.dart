class DeviceInfo {
  const DeviceInfo({
    required this.deviceId,
    required this.name,
    required this.platform,
  });

  final String deviceId;
  final String name;
  final String platform;

  Map<String, String> toJson() => {
        'deviceId': deviceId,
        'name': name,
        'platform': platform,
      };
}
