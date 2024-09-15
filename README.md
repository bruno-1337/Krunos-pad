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

✅ P̶a̶s̶s̶w̶o̶r̶d̶ ̶p̶r̶o̶t̶e̶c̶t̶i̶o̶n̶:̶ ̶A̶d̶d̶ ̶a̶n̶ ̶o̶p̶t̶i̶o̶n̶ ̶t̶o̶ ̶l̶o̶c̶k̶ ̶y̶o̶u̶r̶ ̶n̶o̶t̶e̶s̶ ̶b̶e̶h̶i̶n̶d̶ ̶a̶ ̶p̶a̶s̶s̶w̶o̶r̶d̶.̶ DONE
✅ ̶C̶u̶s̶t̶o̶m̶i̶z̶a̶b̶l̶e̶ ̶f̶o̶n̶t̶ ̶s̶i̶z̶e̶:̶ ̶L̶e̶t̶ ̶u̶s̶e̶r̶s̶ ̶a̶d̶j̶u̶s̶t̶ ̶f̶o̶n̶t̶ ̶s̶i̶z̶e̶s̶ ̶f̶o̶r̶ ̶b̶e̶t̶t̶e̶r̶ ̶r̶e̶a̶d̶a̶b̶i̶l̶i̶t̶y̶.̶
✅ ̶T̶i̶m̶e̶s̶t̶a̶m̶p̶s̶ ̶f̶o̶r̶ ̶u̶p̶d̶a̶t̶e̶s̶:̶ ̶T̶r̶a̶c̶k̶ ̶w̶h̶e̶n̶ ̶n̶o̶t̶e̶s̶ ̶a̶r̶e̶ ̶m̶o̶d̶i̶f̶i̶e̶d̶ ̶t̶o̶ ̶p̶r̶e̶v̶e̶n̶t̶ ̶o̶v̶e̶r̶w̶r̶i̶t̶i̶n̶g̶.̶ DONE
You can suggest anything using the issues page.

# 🤝 Contributing
We welcome contributions! Feel free to fork the repo, open a pull request, or submit issues.
