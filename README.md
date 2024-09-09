# 📝 KrunosPad

A simple, lightweight local implementation inspired by [DontPad](http://dontpad.com), designed to run locally with [Bun](https://bun.sh/).

**KrunosPad** lets you quickly share text and notes over HTTP, just open your browser and start typing!

---

## 📦 Running KrunosPad with Bun

Make sure [Bun](https://bun.sh) is installed on your machine. Then, you can install dependencies and start the server with the following commands:

```bash
bun install
bun run start
```
After running, you should see:

```bash
📝 KrunosPad works on port 7331 📝
```
Now visit http://localhost:7331 in your browser and start taking notes!

# 🐳 Running KrunosPad with Docker
To run KrunosPad inside a Docker container, follow these steps:

1- **Build the Docker image**:

```bash
docker-compose build
```
2- **Run the application**:

```bash
docker-compose up
```
The application will be accessible at http://localhost:7331.

# ⚙️Custom Port Configuration
By default, KrunosPad runs on port 7331. You can change this by either:

- Passing the --port argument when starting the app:
```bash
bun run start --port 8080
```
- Editing the server.ts file to set a custom port.

# 🛠️ Roadmap
Here's some features i want to implement:

- Password protection: Add an option to lock your notes behind a password.
- Customizable font size: Let users adjust font sizes for better readability.
- Timestamps for updates: Track when notes are modified to prevent overwriting.

# 🤝 Contributing
We welcome contributions! Feel free to fork the repo, open a pull request, or submit issues.
