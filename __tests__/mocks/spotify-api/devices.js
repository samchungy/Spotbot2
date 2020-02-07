const mockFetchDevices = {
  devices: [
    {
      id: '87997bb4312981a00f1d8029eb874c55a211a0cc',
      is_active: false,
      is_private_session: false,
      is_restricted: false,
      name: 'AU13282',
      type: 'Computer',
      volume_percent: 100,
    },
  ],
};

const mockFetchDevicesNone = {
  devices: [
  ],
};

module.exports = {mockFetchDevices, mockFetchDevicesNone};
