module.exports = {
  apps: [
    {
      name: 'fcm-api',
      script: 'src/server.js',
      instances: process.env.WEB_CONCURRENCY || 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production',
        PORT: process.env.PORT || 3000,
      },
    },
  ],
};
