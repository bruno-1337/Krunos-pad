## KrunosPad

A local implementation inspired by DontPad to run locally using Bun!

## Running KrunosPad with Bun

Ensure that [Bun](https://bun.sh/) is installed on your system.

Install dependencies and run the project using Bun:

```bash
bun install
bun run start
```
output:
```
📝 KrunosPad works on port 7331 📝
```

## Running KrunosPad with Docker

Build the Docker image:
```bash
docker-compose build
```

Run the application:
```bash
docker-compose up
```

## Configurations

By default the app runs on port 7331 but you can change it by using the argument --port or by editing the ```server.ts``` file

## Roadmap

```
- Add Password option
- Add a option to change font size
- Get timestamps of each update so people don't overwrite each other
```

