module.exports = {
  apps: [
    {
      name: "cloudradius-web",
      cwd: "/opt/cloudradius-app",
      script: "node_modules/.bin/next",
      args: "start -p 3000",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      instances: 1,
      exec_mode: "fork",
      max_memory_restart: "1G",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      error_file: "/var/log/cloudradius/web-error.log",
      out_file: "/var/log/cloudradius/web-out.log",
      merge_logs: true,
    },
    {
      name: "cloudradius-worker",
      cwd: "/opt/cloudradius-app",
      script: "tsx",
      args: "src/jobs/worker.ts",
      env: {
        NODE_ENV: "production",
      },
      instances: 1,
      exec_mode: "fork",
      max_memory_restart: "512M",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      error_file: "/var/log/cloudradius/worker-error.log",
      out_file: "/var/log/cloudradius/worker-out.log",
      merge_logs: true,
    },
  ],
};
