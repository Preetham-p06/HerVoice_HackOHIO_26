# Local demo launcher

Run `npm run demo:start` to launch the website and API under a detached supervisor. It survives closing the launching terminal and restarts an exited service within a few seconds.

- Website: http://localhost:3000/
- Status: `npm run demo:status`
- Stop: `npm run demo:stop`
- Logs: `.data/demo-logs/`

Do not run `npm run dev:all` at the same time; it uses the same ports. Run `demo:start` again after restarting the computer. Keep the Mac awake during judging. This is a local development demo, not production hosting. It cannot guarantee uptime or restore network/provider failures. Judges on other devices need a separately deployed URL; localhost refers to their own computer.
