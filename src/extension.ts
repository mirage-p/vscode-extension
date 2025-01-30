import * as vscode from "vscode";
import ollama from "ollama";

export function activate(context: vscode.ExtensionContext) {
  const disposaable = vscode.commands.registerCommand(
    "mirage-ext.start",
    () => {
      const panel = vscode.window.createWebviewPanel(
        "deepChat",
        "Deepseek Chat",
        vscode.ViewColumn.One,
        { enableScripts: true }
      );
      panel.webview.html = getWebViewContent();

      panel.webview.onDidReceiveMessage(async (message: any) => {
        if (message.command === "chat") {
          const userPrompt = message.text;
          let responseText = "";

          try {
            const streamResposne = await ollama.chat({
              model: "deepseek-r1:1.5b",
              messages: [{ role: "user", content: userPrompt }],
              stream: true,
            });

            for await (const part of streamResposne) {
              responseText += part.message.content;
              console.log(responseText);
              panel.webview.postMessage({
                command: "chatResponse",
                text: responseText,
              });
            }
          } catch (err) {}
        }
      });
    }
  );

  context.subscriptions.push(disposaable);
}

function getWebViewContent(): string {
  return /*html*/ `
	<!DOCTYPE html>
	<html lang="en">
	<head>
		<meta charset="UTF-8">
		<style>
			body {font-family: sans-serif; margin: 1rem; }
			#prompt {width: 100%; box-sizing: border-box}
			#response {border: 1px solid #ccc; margin-top: 1rem; padding: 0.5rem; min-height: 150px}
		</style>
	</head>
	<body>
		<h2>DeepSeek VS Code Extension</h2>
		<textarea id="prompt" rows="3" placeholder="Ask something ..."></textarea><br />
		<button id="askButton">Ask</button>
		<div id="response"></div>
		<script>
			const vscode = acquireVsCodeApi();
			
			document.getElementById('askButton').addEventListener('click', () => {
				const text = document.getElementById('prompt').value;
				console.log(text)
				vscode.postMessage({command: 'chat', text})
			});

			window.addEventListener('message', event => {
				const {command, text} = event.data;
				if (command === "chatResponse") {
					document.getElementById("response").innerText = text;
				}
			})
		</script>
	</body>
	`;
}

export function deactivate() {}
