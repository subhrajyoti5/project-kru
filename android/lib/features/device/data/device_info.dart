class DeviceInfo {
  const DeviceInfo({
    required this.deviceId,
    required this.name,
    required this.platform,
    required this.manufacturer,
    required this.model,
    required this.brand,
    required this.androidVersion,
    required this.sdkInt,
    required this.network,
  });

  final String deviceId;
  final String name;
  final String platform;
  final String manufacturer;
  final String model;
  final String brand;
  final String androidVersion;
  final String sdkInt;
  final String network;

  Map<String, String> toJson() => {
        'deviceId': deviceId,
        'name': name,
        'platform': platform,
        'manufacturer': manufacturer,
        'model': model,
        'brand': brand,
        'androidVersion': androidVersion,
        'sdkInt': sdkInt,
        'network': network,
      };
}
