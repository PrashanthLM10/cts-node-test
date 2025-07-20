module.exports = {
  apps: [
    {
      name: "nucleus-server",
      script: "src/index.js",
      env_production: {
        NODE_ENV: "production",
        PORT: 443,
        FILES_PRESIGNED_URL_EXPIRY: 3600,
      },
      env_development: {
        NODE_ENV: "development",
        PORT: 443,
        FILES_PRESIGNED_URL_EXPIRY: 36000,
      },
      watch: true,
    },
  ],

  // Deployment Configuration
  deploy: {
    production: {
      user: "ubuntu",
      host: ["15.207.71.30"],
      ref: "origin/master",
      repo: "git@github.com:PrashanthLM10/cts-node-test.git",
      path: "/var/www/my-repository",
      "post-deploy":
        "npm i && pm2 startOrRestart ecosystem.json --env production",
    },
  },
};
