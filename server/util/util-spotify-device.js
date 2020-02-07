/**
 * Device for Spotify
 */
class Device {
  /**
   * Creates a spotify device object
   * @param {Object} deviceObject
   */
  constructor(deviceObject) {
    this.name = `${deviceObject.name} - ${deviceObject.type}`;
    this.id = deviceObject.id;
  }
}

module.exports = Device;
