import type {
	IDataObject,
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeApiError, NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

import {
	channelProperties,
	executeChannel,
	executeMessage,
	executeTemplate,
	loadBusinessOptions,
	loadMessageTemplateOptions,
	loadTemplateOptions,
	messageProperties,
	templateProperties,
} from './resources';
import type {
	HubMessageChannelOperation,
	HubMessageMessageOperation,
	HubMessageResource,
	HubMessageTemplateOperation,
} from './types';

function formatContinueOnFailError(error: unknown): IDataObject {
	if (error instanceof Error) {
		return { error: error.message };
	}

	return { error: String(error) };
}

export class HubMessage implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'HubMessage',
		name: 'hubMessage',
		icon: {
			light: 'file:../../icons/hubmessage.svg',
			dark: 'file:../../icons/hubmessage.dark.svg',
		},
		group: ['transform'],
		version: 1,
		subtitle: '={{ $parameter["operation"] || $parameter["resource"] }}',
		description: 'Interact with the HubMessage API',
		defaults: {
			name: 'HubMessage',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'hubMessageApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				default: 'message',
				options: [
					{
						name: 'Channel',
						value: 'channel',
						description: 'Create and manage HubMessage channels',
					},
					{
						name: 'Message',
						value: 'message',
						description: 'Send messages through a connected channel',
					},
					{
						name: 'Template',
						value: 'template',
						description: 'Create and manage WhatsApp message templates',
					},
				],
			},
			...channelProperties,
			...messageProperties,
			...templateProperties,
		],
		usableAsTool: true,
	};

	methods = {
		loadOptions: {
			async getBusinesses(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				return await loadBusinessOptions.call(this);
			},
			async getTemplates(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				return await loadTemplateOptions.call(this);
			},
			async getMessageTemplates(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				return await loadMessageTemplateOptions.call(this);
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				const resource = this.getNodeParameter('resource', itemIndex) as HubMessageResource;

				if (resource === 'channel') {
					const operation = this.getNodeParameter(
						'operation',
						itemIndex,
					) as HubMessageChannelOperation;
					const results = await executeChannel.call(this, itemIndex, operation);
					returnData.push(
						...results.map((result) => ({
							json: result,
							pairedItem: { item: itemIndex },
						})),
					);
					continue;
				}

				if (resource === 'message') {
					const operation = this.getNodeParameter(
						'operation',
						itemIndex,
					) as HubMessageMessageOperation;
					const result = await executeMessage.call(this, itemIndex, operation);
					returnData.push({
						json: result,
						pairedItem: { item: itemIndex },
					});
					continue;
				}

				if (resource === 'template') {
					const operation = this.getNodeParameter(
						'operation',
						itemIndex,
					) as HubMessageTemplateOperation;
					const results = await executeTemplate.call(this, itemIndex, operation);
					returnData.push(
						...results.map((result) => ({
							json: result,
							pairedItem: { item: itemIndex },
						})),
					);
					continue;
				}

				throw new NodeOperationError(this.getNode(), `Unsupported resource: ${String(resource)}`, {
					itemIndex,
				});
			} catch (error: unknown) {
				const executionError =
					error instanceof NodeApiError || error instanceof NodeOperationError
						? error
						: new NodeOperationError(
								this.getNode(),
								error instanceof Error ? error : new Error(String(error)),
								{ itemIndex },
							);

				if (this.continueOnFail()) {
					returnData.push({
						json: formatContinueOnFailError(executionError),
						pairedItem: { item: itemIndex },
					});
					continue;
				}

				throw executionError;
			}
		}

		return [returnData];
	}
}
