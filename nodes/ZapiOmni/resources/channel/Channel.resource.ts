import type {
	IDataObject,
	IExecuteFunctions,
	INodeProperties,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { zapiOmniApiRequest } from '../../transport/ZapiOmniApiRequest';
import type { ZapiOmniChannelOperation } from '../../types';

const CHANNELS_ENDPOINT = '/v1/channels';

export const channelProperties: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		default: 'create',
		displayOptions: {
			show: {
				resource: ['channel'],
			},
		},
		options: [
			{
				name: 'Connect',
				value: 'connect',
				action: 'Connect a channel',
				description: 'Finalize a Meta WhatsApp channel connection using data from the SDK',
			},
			{
				name: 'Create',
				value: 'create',
				action: 'Create a channel',
				description: 'Create a new Z-API Omni channel',
			},
		],
	},
	{
		displayName:
			'Use the <a href="https://developer.omni.z-api.io/channels/connect-channel" target="_blank">Z-API Omni Connect SDK</a> first to obtain the WABA ID, Phone ID, authorization code, and coexistence value',
		name: 'connectSdkNotice',
		type: 'notice',
		default: '',
		displayOptions: {
			show: {
				resource: ['channel'],
				operation: ['connect'],
			},
		},
	},
	{
		displayName: 'Channel ID',
		name: 'channelId',
		type: 'string',
		default: '',
		required: true,
		description: 'ID returned by the Create Channel operation',
		displayOptions: {
			show: {
				resource: ['channel'],
				operation: ['connect'],
			},
		},
	},
	{
		displayName: 'WABA ID',
		name: 'wabaId',
		type: 'string',
		default: '',
		required: true,
		description: 'WhatsApp Business Account ID returned by the Connect SDK',
		displayOptions: {
			show: {
				resource: ['channel'],
				operation: ['connect'],
			},
		},
	},
	{
		displayName: 'Phone ID',
		name: 'phoneId',
		type: 'string',
		default: '',
		required: true,
		description: 'WhatsApp phone number ID returned by the Connect SDK',
		displayOptions: {
			show: {
				resource: ['channel'],
				operation: ['connect'],
			},
		},
	},
	{
		displayName: 'Authorization Code',
		name: 'code',
		type: 'string',
		default: '',
		required: true,
		description: 'Temporary authorization code returned by the Connect SDK',
		displayOptions: {
			show: {
				resource: ['channel'],
				operation: ['connect'],
			},
		},
	},
	{
		displayName: 'Coexistence',
		name: 'coexistence',
		type: 'boolean',
		default: false,
		required: true,
		description: 'Whether the WhatsApp number uses coexistence mode',
		displayOptions: {
			show: {
				resource: ['channel'],
				operation: ['connect'],
			},
		},
	},
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'Sales WhatsApp',
		description: 'Name used to identify the channel in Z-API Omni',
		displayOptions: {
			show: {
				resource: ['channel'],
				operation: ['create'],
			},
		},
	},
	{
		displayName: 'Type',
		name: 'channelType',
		type: 'options',
		default: 'META_WHATSAPP',
		required: true,
		description: 'Messaging platform used by the channel',
		displayOptions: {
			show: {
				resource: ['channel'],
				operation: ['create'],
			},
		},
		options: [
			{
				name: 'WhatsApp (Meta Official API)',
				value: 'META_WHATSAPP',
			},
		],
	},
];

function getRequiredString(
	context: IExecuteFunctions,
	name: string,
	itemIndex: number,
	displayName: string,
): string {
	const value = String(context.getNodeParameter(name, itemIndex, '')).trim();
	if (!value) {
		throw new NodeOperationError(context.getNode(), `${displayName} is required`, { itemIndex });
	}

	return value;
}

async function createChannel(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<IDataObject> {
	const name = getRequiredString(context, 'name', itemIndex, 'Name');
	const type = getRequiredString(context, 'channelType', itemIndex, 'Type');

	return (await zapiOmniApiRequest.call(context, 'POST', CHANNELS_ENDPOINT, itemIndex, {
		name,
		type,
	})) as IDataObject;
}

async function connectChannel(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<IDataObject> {
	const channelId = getRequiredString(context, 'channelId', itemIndex, 'Channel ID');
	const wabaId = getRequiredString(context, 'wabaId', itemIndex, 'WABA ID');
	const phoneId = getRequiredString(context, 'phoneId', itemIndex, 'Phone ID');
	const code = getRequiredString(context, 'code', itemIndex, 'Authorization Code');
	const coexistence = context.getNodeParameter('coexistence', itemIndex, false) as boolean;

	return (await zapiOmniApiRequest.call(
		context,
		'POST',
		`/v1/channels/${encodeURIComponent(channelId)}/connect`,
		itemIndex,
		{
			wabaId,
			phoneId,
			code,
			coexistence,
		},
	)) as IDataObject;
}

export async function executeChannel(
	this: IExecuteFunctions,
	itemIndex: number,
	operation: ZapiOmniChannelOperation,
): Promise<IDataObject[]> {
	if (operation === 'connect') {
		return [await connectChannel(this, itemIndex)];
	}

	if (operation === 'create') {
		return [await createChannel(this, itemIndex)];
	}

	throw new NodeOperationError(this.getNode(), `Unsupported Channel operation: ${String(operation)}`, {
		itemIndex,
	});
}
