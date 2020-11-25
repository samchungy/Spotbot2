/**
 * Route Error
 */
class RouteError extends Error {
  /**
   * @param {string} message
   */
  constructor(message) {
    super(message);
    this.name = 'RouteError';
  }
}

/**
 * Bad Request Error
 */
class BadRequestError extends RouteError {
  /**
   * @param {string} message
   */
  constructor(message) {
    super(message);
    this.code = 400;
    this.name = 'BadRequestError';
  }
}

/**
 * Bad Gateway
 */
class BadGatewayError extends RouteError {
  /**
   * @param {string} message
   */
  constructor(message) {
    super(message);
    this.code = 500;
    this.name = 'BadGateWayError';
  }
}

module.exports = {
  BadGatewayError,
  BadRequestError,
  RouteError,
};

