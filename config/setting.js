module.exports = {
  app: {
    name: 'RealScan Premium',
    version: '2.0.0',
    port: process.env.PORT || 3000
  },
  security: {
    jwtSecret: process.env.JWT_SECRET || 'realscan-premium-secret',
    bcryptRounds: 12
  },
  limits: {
    maxAccessCodes: 100,
    maxScanResults: 1000,
    accessCodeDuration: {
      min: 5, // minit
      max: 1440 // minit (24 jam)
    }
  }
};
