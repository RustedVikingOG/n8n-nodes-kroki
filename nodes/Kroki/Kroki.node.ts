import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IBinaryData,
} from 'n8n-workflow';
import { NodeConnectionType, NodeOperationError } from 'n8n-workflow';
import { Buffer } from 'buffer';

/**
 * Get MIME type for output format
 */
function getMimeType(outputFormat: string): string {
	switch (outputFormat) {
		case 'png':
			return 'image/png';
		case 'svg':
			return 'image/svg+xml';
		case 'pdf':
			return 'application/pdf';
		default:
			return 'application/octet-stream';
	}
}

/**
 * Kroki diagram conversion node for n8n
 * Converts text-based diagrams to binary image formats using Kroki API
 */
export class Kroki implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Kroki',
		name: 'kroki',
		icon: { light: 'file:kroki.svg', dark: 'file:kroki.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["diagramType"] + " to " + $parameter["outputFormat"]}}',
		description: 'Convert text-based diagrams to images using Kroki API',
		defaults: {
			name: 'Kroki',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		usableAsTool: true,
		properties: [
			{
				displayName: 'Diagram Type',
				name: 'diagramType',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'ActDiag',
						value: 'actdiag',
						description: 'Activity diagrams',
					},
					{
						name: 'BlockDiag',
						value: 'blockdiag',
						description: 'BlockDiag diagrams',
					},
					{
						name: 'C4 PlantUML',
						value: 'c4plantuml',
						description: 'C4 model diagrams',
					},
					{
						name: 'D2',
						value: 'd2',
						description: 'D2 declarative diagrams',
					},
					{
						name: 'DBML',
						value: 'dbml',
						description: 'Database markup language',
					},
					{
						name: 'Ditaa',
						value: 'ditaa',
						description: 'Ditaa ASCII art diagrams',
					},
					{
						name: 'Excalidraw',
						value: 'excalidraw',
						description: 'Excalidraw diagrams',
					},
					{
						name: 'GraphViz',
						value: 'graphviz',
						description: 'GraphViz DOT diagrams',
					},
					{
						name: 'Mermaid',
						value: 'mermaid',
						description: 'Mermaid diagrams (flowcharts, sequence, gantt, etc.)',
					},
					{
						name: 'Nomnoml',
						value: 'nomnoml',
						description: 'Nomnoml UML diagrams',
					},
					{
						name: 'NwDiag',
						value: 'nwdiag',
						description: 'Network diagrams',
					},
					{
						name: 'Pikchr',
						value: 'pikchr',
						description: 'Pikchr diagrams',
					},
					{
						name: 'PlantUML',
						value: 'plantuml',
						description: 'PlantUML diagrams',
					},
					{
						name: 'SeqDiag',
						value: 'seqdiag',
						description: 'Sequence diagrams',
					},
					{
						name: 'Structurizr',
						value: 'structurizr',
						description: 'Structurizr diagrams',
					},
					{
						name: 'Svgbob',
						value: 'svgbob',
						description: 'Svgbob ASCII art',
					},
					{
						name: 'TikZ',
						value: 'tikz',
						description: 'TikZ diagrams',
					},
					{
						name: 'UMLet',
						value: 'umlet',
						description: 'UMLet diagrams',
					},
					{
						name: 'Vega',
						value: 'vega',
						description: 'Vega visualization',
					},
					{
						name: 'Vega-Lite',
						value: 'vegalite',
						description: 'Vega-Lite visualization',
					},
					{
						name: 'WaveDrom',
						value: 'wavedrom',
						description: 'WaveDrom digital timing diagrams',
					},
					{
						name: 'WireViz',
						value: 'wireviz',
						description: 'WireViz cable diagrams',
					},
				],
				default: 'mermaid',
				description: 'Type of diagram to convert',
			},
			{
				displayName: 'Output Format',
				name: 'outputFormat',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'PNG',
						value: 'png',
						description: 'High-quality raster image format',
					},
					{
						name: 'SVG',
						value: 'svg',
						description: 'Scalable vector graphics format',
					},
					{
						name: 'PDF',
						value: 'pdf',
						description: 'Portable document format',
					},
				],
				default: 'png',
				description: 'Output image format',
			},
			{
				displayName: 'Diagram Source',
				name: 'diagramSource',
				type: 'string',
				typeOptions: {
					editor: 'codeNodeEditor',
					editorLanguage: 'text',
				},
				default: '',
				placeholder: 'Enter your diagram source code here...',
				description: 'The source code of the diagram to convert',
				required: true,
			},
			{
				displayName: 'Kroki Server',
				name: 'krokiServer',
				type: 'options',
				options: [
					{
						name: 'Public Service (kroki.io)',
						value: 'public',
						description: 'Use the public Kroki service at kroki.io',
					},
					{
						name: 'Custom Server',
						value: 'custom',
						description: 'Use a custom Kroki server',
					},
				],
				default: 'public',
				description: 'Kroki server to use for conversion',
			},
			{
				displayName: 'Custom Server URL',
				name: 'customServerUrl',
				type: 'string',
				default: '',
				placeholder: 'https://your-kroki-server.com',
				description: 'URL of your custom Kroki server',
				displayOptions: {
					show: {
						krokiServer: ['custom'],
					},
				},
				required: true,
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				options: [
					{
						displayName: 'Timeout',
						name: 'timeout',
						type: 'number',
						default: 30000,
						description: 'Request timeout in milliseconds',
						typeOptions: {
							minValue: 1000,
							maxValue: 300000,
						},
					},
					{
						displayName: 'Binary Property Name',
						name: 'binaryPropertyName',
						type: 'string',
						default: 'data',
						description: 'Name of the binary property to store the generated image',
					},
				],
			},
		],
	};

	/**
	 * Main execution function for the Kroki node
	 */
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				const diagramType = this.getNodeParameter('diagramType', itemIndex) as string;
				const outputFormat = this.getNodeParameter('outputFormat', itemIndex) as string;
				const diagramSource = this.getNodeParameter('diagramSource', itemIndex) as string;
				const krokiServer = this.getNodeParameter('krokiServer', itemIndex) as string;
				const customServerUrl = this.getNodeParameter('customServerUrl', itemIndex, '') as string;
				const options = this.getNodeParameter('options', itemIndex, {}) as IDataObject;

				// Validate required parameters
				if (!diagramSource.trim()) {
					throw new NodeOperationError(this.getNode(), 'Diagram source is required', { itemIndex });
				}

				// Determine the Kroki server URL
				const baseUrl =
					krokiServer === 'custom' ? customServerUrl.replace(/\/$/, '') : 'https://kroki.io';

				if (krokiServer === 'custom' && !customServerUrl.trim()) {
					throw new NodeOperationError(
						this.getNode(),
						'Custom server URL is required when using custom server option',
						{ itemIndex },
					);
				}

				// Validate custom server URL format
				if (krokiServer === 'custom') {
					if (!customServerUrl.match(/^https?:\/\/.+/)) {
						throw new NodeOperationError(this.getNode(), 'Invalid custom server URL format', {
							itemIndex,
						});
					}
				}

				// Prepare the request
				const url = `${baseUrl}/${diagramType}/${outputFormat}`;
				const timeout = (options.timeout as number) || 30000;
				const binaryPropertyName = (options.binaryPropertyName as string) || 'data';

				// Use the simplest possible approach - minimal HTTP request
				const responseBody = await this.helpers.request({
					method: 'POST' as const,
					url: url,
					body: diagramSource,
					headers: {
						'Content-Type': 'text/plain',
					},
					timeout: timeout,
					encoding: null, // Return raw buffer
				});

				// Get MIME type based on output format
				const mimeType = getMimeType(outputFormat);

				// Debug the actual response
				const debugInfo: any = {
					bodyType: typeof responseBody,
					bodyConstructor: responseBody?.constructor?.name,
					bodyLength: responseBody?.length || responseBody?.byteLength || 0,
					isBuffer: Buffer.isBuffer(responseBody),
					url: url,
					diagramLength: diagramSource.length,
				};

				// Add format-specific debug info
				if (outputFormat === 'svg' && typeof responseBody === 'string') {
					debugInfo.firstChars = responseBody.substring(0, 100);
				} else if (Buffer.isBuffer(responseBody)) {
					debugInfo.firstBytes = responseBody.slice(0, 16).toString('hex');
					debugInfo.startsWithPNG = responseBody.slice(0, 4).toString('hex') === '89504e47';
				}

				// Convert to base64 for n8n binary storage
				let base64Data: string;
				if (Buffer.isBuffer(responseBody)) {
					base64Data = responseBody.toString('base64');
				} else if (typeof responseBody === 'string') {
					base64Data = Buffer.from(responseBody, 'utf8').toString('base64');
				} else {
					throw new NodeOperationError(this.getNode(), `Unexpected response type: ${typeof responseBody}`, { itemIndex });
				}

				const binaryData: IBinaryData = {
					data: base64Data,
					mimeType,
					fileName: `diagram.${outputFormat}`,
					fileExtension: outputFormat,
				};

				// Create return item
				const returnItem: INodeExecutionData = {
					json: {
						diagramType,
						outputFormat,
						fileName: `diagram.${outputFormat}`,
						mimeType,
						success: true,
						// Flatten debug info to make it visible
						bodyType: debugInfo.bodyType,
						bodyConstructor: debugInfo.bodyConstructor,
						bodyLength: debugInfo.bodyLength,
						isBuffer: debugInfo.isBuffer,
						startsWithPNG: debugInfo.startsWithPNG,
						firstBytes: debugInfo.firstBytes,
						url: debugInfo.url,
						diagramLength: debugInfo.diagramLength,
						debug: debugInfo,
					},
					binary: {
						[binaryPropertyName]: binaryData,
					},
					pairedItem: itemIndex,
				};

				returnData.push(returnItem);
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: (error as Error).message,
							success: false,
						},
						pairedItem: itemIndex,
					});
				} else {
					if ((error as any).context) {
						(error as any).context.itemIndex = itemIndex;
						throw error;
					}
					throw new NodeOperationError(this.getNode(), error as Error, { itemIndex });
				}
			}
		}

		return [returnData];
	}
}
