# LocalMate

LocalMate is a personal desktop application that talks directly with your locally installed LLMs. It empowers you with features like text rewriting, grammar fixes, and seamless Jira updates—all while keeping your data private and entirely on your local machine.

Built with **React**, **Vite**, and **Tauri**.

## 📦 Installing Packages

Before running the application, ensure you have [Node.js](https://nodejs.org/) installed, along with the necessary [Tauri prerequisites](https://tauri.app/v1/guides/getting-started/prerequisites) for your operating system.

To install the Node dependencies, run:

```bash
npm install
```

## ⚙️ Environments

LocalMate requires environment variables to configure its connection to your local LLM provider (e.g., Ollama).

1. Copy the provided example environment file to create your own `.env` file:

   ```bash
   cp .env.example .env
   ```

2. Open the `.env` file. It will look like this by default:
   ```env
   VITE_OLLAMA_BASE_URL=http://localhost:11434
   VITE_DEFAULT_MODEL=llama3.2
   VITE_DEFAULT_TEMPERATURE=0.3
   ```
   _Note: Ensure your local LLM server (like Ollama) is running on the specified `VITE_OLLAMA_BASE_URL` and that the model defined in `VITE_DEFAULT_MODEL` is pulled/available locally._

## 🚀 Running

To start LocalMate in development mode (this will spin up the Vite dev server and launch the native Tauri application window):

```bash
npm run tauri dev
```

To build the optimized release bundle for your operating system:

```bash
npm run tauri build
```

_(The compiled binaries will be output into the `src-tauri/target/release` folder)_

## 🔄 Workflow

1. **Start Local LLM**: Launch your local LLM instance (e.g., run `ollama serve` and ensure the `llama3.2` model is available). You can specify and use your own model too by changing the `VITE_DEFAULT_MODEL` and `VITE_OLLAMA_BASE_URL` environment variables. Check [Ollama](https://ollama.com/) for more information and download latest version of Ollama.
2. **Launch App**: Open LocalMate via `npm run tauri dev`.
3. **Hot-Reloading**: As you make changes to the frontend code in the `src/` directory, Vite will automatically hot-reload the UI.
4. **Rust Changes**: If you modify the backend logic in `src-tauri/src/`, Tauri will automatically detect the changes and recompile the Rust binary.
5. **Interact**: Use the native desktop interface to send prompts, rewrite text, fix grammar, and generate Jira updates powered by your local machine!

Contributions are alaways Welcome!

---

Built with ❤️ by [Ashiq Rabbani](https://github.com/ashik-e-rabbani)
