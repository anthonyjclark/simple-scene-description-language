import { DocumentState, EmptyFileSystem } from 'langium';
import { startLanguageServer } from 'langium/lsp';
import { BrowserMessageReader, BrowserMessageWriter, createConnection, Diagnostic, NotificationType } from 'vscode-languageserver/browser.js';
import { createSsdlServices } from './ssdl-module.js';

import { Robot } from './generated/ast.js'
import { generate } from './generator.js'

declare const self: DedicatedWorkerGlobalScope;

const messageReader = new BrowserMessageReader(self);
const messageWriter = new BrowserMessageWriter(self);

const connection = createConnection(messageReader, messageWriter);

// const { shared, Ssdl } = createSsdlServices({ connection, ...EmptyFileSystem });
const { shared  } = createSsdlServices({ connection, ...EmptyFileSystem });

startLanguageServer(shared);

// Send a notification with the AST after every document change
type DocumentChange = { uri: string, urdf: string, config: Map<string, number> | null, diagnostics: Diagnostic[] };
const documentChangeNotification = new NotificationType<DocumentChange>('browser/DocumentChange');
// const jsonSerializer = Ssdl.serializer.JsonSerializer;

// Listen on fully validated documents
shared.workspace.DocumentBuilder.onBuildPhase(DocumentState.Validated, documents => {

	for (const document of documents) {
		// Grab the top-level AST node
		const robot = document.parseResult.value as Robot;

		let urdf: string = "";
		let config = null;

		// Check for errors
		const errors = document.diagnostics?.filter((diagnostic) => diagnostic.severity === 1);
		if (!errors || errors.length === 0) {
			// TODO: catch errors such as those from math.js
			[urdf, config] = generate(robot);
		}

		// Inject the generated URDF into the robot object
		(robot as unknown as { $urdf: string }).$urdf = urdf;

		// Send the notification
		connection.sendNotification(documentChangeNotification, {
			uri: document.uri.toString(),
			urdf: urdf,
			config: config,
			diagnostics: document.diagnostics ?? []
		})

	}
})
