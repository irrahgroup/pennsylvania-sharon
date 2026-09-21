import type { IDataObject, IExecuteFunctions, INodeProperties } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { templateLanguageOptions } from '../../TemplateLanguages';
import type { ZapiOmniMessageOperation } from '../../types';
import { zapiOmniApiRequest } from '../../transport/ZapiOmniApiRequest';

const allMessageOperations: ZapiOmniMessageOperation[] = [
	'sendAudio',
	'sendContact',
	'sendImage',
	'sendInteractiveAction',
	'sendInteractiveButton',
	'sendSticker',
	'sendTemplate',
	'sendText',
	'sendVideo',
];

const mediaMessageOperations: ZapiOmniMessageOperation[] = [
	'sendAudio',
	'sendImage',
	'sendSticker',
	'sendVideo',
];

export const messageProperties: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		default: 'sendText',
		displayOptions: {
			show: {
				resource: ['message'],
			},
		},
		options: [
			{
				name: 'Send Audio',
				value: 'sendAudio',
				action: 'Send an audio message',
				description: 'Send audio from a public URL during the open conversation window',
			},
			{
				name: 'Send Contact',
				value: 'sendContact',
				action: 'Send a contact',
				description: 'Send a contact with one or more phone numbers',
			},
			{
				name: 'Send Image',
				value: 'sendImage',
				action: 'Send an image message',
				description: 'Send an image from a public URL with an optional caption',
			},
			{
				name: 'Send Interactive Action',
				value: 'sendInteractiveAction',
				action: 'Send action buttons',
				description: 'Send URL and call action buttons with optional header and footer',
			},
			{
				name: 'Send Interactive Button',
				value: 'sendInteractiveButton',
				action: 'Send reply buttons',
				description: 'Send up to three quick-reply buttons with optional image or video',
			},
			{
				name: 'Send Sticker',
				value: 'sendSticker',
				action: 'Send a sticker message',
				description: 'Send a WebP sticker from a public URL',
			},
			{
				name: 'Send Template',
				value: 'sendTemplate',
				action: 'Send a template message',
				description: 'Send an approved WhatsApp template, including outside the 24-hour window',
			},
			{
				name: 'Send Text',
				value: 'sendText',
				action: 'Send a text message',
				description: 'Send a text message during the open WhatsApp conversation window',
			},
			{
				name: 'Send Video',
				value: 'sendVideo',
				action: 'Send a video message',
				description: 'Send a video from a public URL with an optional caption',
			},
		],
	},
	{
		displayName: 'Channel ID',
		name: 'channelId',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'YOUR_CHANNEL_ID',
		description: 'ID of the connected Z-API Omni channel used to send the message',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: allMessageOperations,
			},
		},
	},
	{
		displayName: 'Recipient',
		name: 'recipient',
		type: 'string',
		default: '',
		required: true,
		placeholder: '5511999999999',
		description: 'Recipient phone number with country code and area code; common formatting is removed',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: allMessageOperations,
			},
		},
	},
	{
		displayName: 'Message',
		name: 'message',
		type: 'string',
		typeOptions: {
			rows: 4,
		},
		default: '',
		required: true,
		description: 'Text content to send to the recipient',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendText'],
			},
		},
	},
	{
		displayName: 'Body Message',
		name: 'interactiveMessage',
		type: 'string',
		typeOptions: {
			rows: 4,
		},
		default: '',
		required: true,
		description: 'Main text displayed above the interactive buttons',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendInteractiveAction', 'sendInteractiveButton'],
			},
		},
	},
	{
		displayName: 'Options',
		name: 'interactiveActionOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		options: [
			{
				displayName: 'Footer',
				name: 'footer',
				type: 'string',
				default: '',
				description: 'Footer text displayed below the action buttons',
			},
			{
				displayName: 'Header',
				name: 'header',
				type: 'string',
				default: '',
				description: 'Header text displayed above the message',
			},
		],
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendInteractiveAction'],
			},
		},
	},
	{
		displayName: 'Legacy Interactive Footer',
		name: 'interactiveFooter',
		type: 'hidden',
		default: '',
		description:
			'Compatibility field for workflows saved before interactive options were grouped',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendInteractiveAction'],
			},
		},
	},
	{
		displayName: 'Legacy Interactive Header',
		name: 'interactiveHeader',
		type: 'hidden',
		default: '',
		description:
			'Compatibility field for workflows saved before interactive options were grouped',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendInteractiveAction'],
			},
		},
	},
	{
		displayName: 'Button Definition',
		name: 'actionButtonsInputMode',
		type: 'options',
		noDataExpression: true,
		default: 'fields',
		options: [
			{
				name: 'Define Below',
				value: 'fields',
				description: 'Add, remove, and configure buttons using form fields',
			},
			{
				name: 'JSON',
				value: 'json',
				description: 'Provide the complete buttons array as JSON or an expression',
			},
		],
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendInteractiveAction'],
			},
		},
	},
	{
		displayName: 'Action Buttons',
		name: 'actionButtonsUi',
		type: 'fixedCollection',
		default: {},
		placeholder: 'Add Action Button',
		required: true,
		typeOptions: {
			multipleValues: true,
			sortable: true,
			minRequiredFields: 1,
			fixedCollection: {
				itemTitle: '={{ $parameter["title"] || "Action Button" }}',
			},
		},
		options: [
			{
				displayName: 'Button',
				name: 'buttonValues',
				values: [
					{
						displayName: 'ID',
						name: 'id',
						type: 'string',
						default: '',
						required: true,
						description: 'Unique identifier returned when this button is selected',
					},
					{
						displayName: 'Phone Numbers',
						name: 'phones',
						type: 'string',
						typeOptions: {
							rows: 2,
						},
						default: '',
						required: true,
						placeholder: '5511999999999, 5511888888888',
						description:
							'One or more numbers with country code; separate multiple numbers by commas, semicolons, or lines',
						displayOptions: {
							show: {
								actionType: ['CALL'],
							},
						},
					},
					{
						displayName: 'Title',
						name: 'title',
						type: 'string',
						default: '',
						required: true,
						description: 'Text displayed on the button',
					},
					{
						displayName: 'Type',
						name: 'actionType',
						type: 'options',
						default: 'URL',
						required: true,
						options: [
							{
								name: 'Call',
								value: 'CALL',
							},
							{
								name: 'Open URL',
								value: 'URL',
							},
						],
						description: 'Action performed when the recipient taps the button',
					},
					{
						displayName: 'URL',
						name: 'url',
						type: 'string',
						default: '',
						required: true,
						placeholder: 'https://omni.z-api.io',
						description: 'HTTP or HTTPS URL opened by this button',
						displayOptions: {
							show: {
								actionType: ['URL'],
							},
						},
					},
				],
			},
		],
		description:
			'Action buttons displayed to the recipient; the Z-API Omni documentation does not declare a maximum count',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendInteractiveAction'],
				actionButtonsInputMode: ['fields'],
			},
		},
	},
	{
		displayName: 'Action Buttons',
		name: 'actionButtons',
		type: 'json',
		default:
			'[\n  {\n    "id": "1",\n    "title": "Visit our site",\n    "name": "URL",\n    "url": "https://omni.z-api.io"\n  }\n]',
		required: true,
		description: 'JSON array of URL or CALL buttons following the Z-API Omni API schema',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendInteractiveAction'],
				actionButtonsInputMode: ['json'],
			},
		},
	},
	{
		displayName: 'Button Definition',
		name: 'replyButtonsInputMode',
		type: 'options',
		noDataExpression: true,
		default: 'fields',
		options: [
			{
				name: 'Define Below',
				value: 'fields',
				description: 'Add, remove, and reorder reply buttons using form fields',
			},
			{
				name: 'JSON',
				value: 'json',
				description: 'Provide the complete buttons array as JSON or an expression',
			},
		],
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendInteractiveButton'],
			},
		},
	},
	{
		displayName: 'Reply Buttons',
		name: 'replyButtonsUi',
		type: 'fixedCollection',
		default: {},
		placeholder: 'Add Reply Button',
		required: true,
		typeOptions: {
			multipleValues: true,
			sortable: true,
			minRequiredFields: 1,
			maxAllowedFields: 3,
			fixedCollection: {
				itemTitle: '={{ $parameter["title"] || "Reply Button" }}',
			},
		},
		options: [
			{
				displayName: 'Button',
				name: 'buttonValues',
				values: [
					{
						displayName: 'ID',
						name: 'id',
						type: 'string',
						default: '',
						required: true,
						description: 'Unique identifier returned when this button is selected',
					},
					{
						displayName: 'Title',
						name: 'title',
						type: 'string',
						default: '',
						required: true,
						description: 'Text displayed on the button',
					},
				],
			},
		],
		description: 'Add between one and three quick-reply buttons',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendInteractiveButton'],
				replyButtonsInputMode: ['fields'],
			},
		},
	},
	{
		displayName: 'Reply Buttons',
		name: 'replyButtons',
		type: 'json',
		default:
			'[\n  {\n    "id": "1",\n    "title": "Yes"\n  },\n  {\n    "id": "2",\n    "title": "No"\n  }\n]',
		required: true,
		description: 'JSON array containing up to three buttons with ID and title',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendInteractiveButton'],
				replyButtonsInputMode: ['json'],
			},
		},
	},
	{
		displayName: 'Options',
		name: 'interactiveButtonOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		options: [
			{
				displayName: 'Custom Thumbnail MIME Type',
				name: 'thumbnailCustomMimeType',
				type: 'string',
				default: '',
				placeholder: 'image/png',
				description: 'MIME type accepted by Z-API Omni when Thumbnail MIME Type is Custom',
			},
			{
				displayName: 'Thumbnail MIME Type',
				name: 'thumbnailMimeType',
				type: 'options',
				default: 'image/jpeg',
				options: [
					{
						name: 'Custom',
						value: 'custom',
					},
					{
						name: 'Image (JPEG)',
						value: 'image/jpeg',
					},
					{
						name: 'Video (MP4)',
						value: 'video/mp4',
					},
				],
				description: 'Media type of the thumbnail; select Custom for another accepted type',
			},
			{
				displayName: 'Thumbnail URL',
				name: 'thumbnailUrl',
				type: 'string',
				default: '',
				placeholder: 'https://example.com/image.jpg',
				description: 'Public URL of an image or video displayed with the reply buttons',
			},
		],
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendInteractiveButton'],
			},
		},
	},
	{
		displayName: 'Legacy Thumbnail MIME Type',
		name: 'thumbnailMimeType',
		type: 'hidden',
		default: 'image/jpeg',
		description:
			'Compatibility field for workflows saved before interactive options were grouped',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendInteractiveButton'],
			},
		},
	},
	{
		displayName: 'Legacy Thumbnail URL',
		name: 'thumbnailUrl',
		type: 'hidden',
		default: '',
		description:
			'Compatibility field for workflows saved before interactive options were grouped',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendInteractiveButton'],
			},
		},
	},
	{
		displayName: 'Media URL',
		name: 'mediaUrl',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'https://example.com/media-file',
		description: 'Public HTTP or HTTPS URL of the media file',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: mediaMessageOperations,
			},
		},
	},
	{
		displayName: 'Options',
		name: 'mediaOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		options: [
			{
				displayName: 'Caption',
				name: 'caption',
				type: 'string',
				typeOptions: {
					rows: 3,
				},
				default: '',
				description: 'Caption sent with the image or video',
			},
		],
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendImage', 'sendVideo'],
			},
		},
	},
	{
		displayName: 'Legacy Caption',
		name: 'caption',
		type: 'hidden',
		default: '',
		description: 'Compatibility field for workflows saved before media options were grouped',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendImage', 'sendVideo'],
			},
		},
	},
	{
		displayName: 'Contact Name',
		name: 'contactName',
		type: 'string',
		default: '',
		required: true,
		description: 'Name of the contact to send',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendContact'],
			},
		},
	},
	{
		displayName: 'Phone Number Definition',
		name: 'contactPhonesInputMode',
		type: 'options',
		noDataExpression: true,
		default: 'fields',
		options: [
			{
				name: 'Comma-Separated List',
				value: 'list',
				description: 'Provide phone numbers separated by commas, semicolons, or lines',
			},
			{
				name: 'Define Below',
				value: 'fields',
				description: 'Add and remove phone numbers using form fields',
			},
		],
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendContact'],
			},
		},
	},
	{
		displayName: 'Contact Phone Numbers',
		name: 'contactPhonesUi',
		type: 'fixedCollection',
		default: {},
		placeholder: 'Add Phone Number',
		required: true,
		typeOptions: {
			multipleValues: true,
			sortable: true,
			minRequiredFields: 1,
			fixedCollection: {
				itemTitle: '={{ $parameter["phone"] || "Phone Number" }}',
			},
		},
		options: [
			{
				displayName: 'Phone Number',
				name: 'phoneValues',
				values: [
					{
						displayName: 'Phone Number',
						name: 'phone',
						type: 'string',
						default: '',
						required: true,
						placeholder: '5511888888888',
						description: 'Phone number with country code and area code; common formatting is removed',
					},
				],
			},
		],
		description: 'One or more phone numbers included in the contact',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendContact'],
				contactPhonesInputMode: ['fields'],
			},
		},
	},
	{
		displayName: 'Contact Phone Numbers',
		name: 'contactPhones',
		type: 'string',
		typeOptions: {
			rows: 3,
		},
		default: '',
		required: true,
		placeholder: '5511888888888, 5511777777777',
		description: 'One or more phone numbers with country code, separated by commas or lines',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendContact'],
				contactPhonesInputMode: ['list'],
			},
		},
	},
	{
		displayName: 'Template Name or ID',
		name: 'messageTemplateName',
		type: 'options',
		typeOptions: {
			loadOptionsMethod: 'getMessageTemplates',
		},
		default: '',
		required: true,
		description:
			'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendTemplate'],
			},
		},
	},
	{
		displayName: 'Language Code',
		name: 'languageCode',
		type: 'options',
		default: 'pt_BR',
		required: true,
		options: templateLanguageOptions,
		description: 'Language of the approved WhatsApp message template',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendTemplate'],
			},
		},
	},
	{
		displayName: 'Removed Visual Builder Mode',
		name: 'messageTemplateComponentsInputModeRemoved',
		type: 'hidden',
		default: 'removed',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendTemplate'],
			},
		},
	},
	{
		displayName: 'Variable Format',
		name: 'messageTemplateParameterFormat',
		type: 'options',
		noDataExpression: true,
		default: 'POSITIONAL',
		options: [
			{
				name: 'Named Variables',
				value: 'NAMED',
			},
			{
				name: 'Positional Variables',
				value: 'POSITIONAL',
			},
		],
		description: 'Must match the variable format used when the template was created',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendTemplate'],
				messageTemplateComponentsInputModeRemoved: ['fields'],
			},
		},
	},
	{
		displayName: 'Body Parameters',
		name: 'messageTemplateBodyPositionalParameters',
		type: 'fixedCollection',
		default: {},
		placeholder: 'Add Body Parameter',
		typeOptions: {
			multipleValues: true,
			sortable: true,
			fixedCollection: {
				itemTitle: '={{ $parameter["value"] || "Body Parameter" }}',
			},
		},
		options: [
			{
				displayName: 'Parameter',
				name: 'parameterValues',
				values: [
					{
						displayName: 'Value',
						name: 'value',
						type: 'string',
						default: '',
						required: true,
						description: 'Value for the positional variable in the same order as the template',
					},
				],
			},
		],
		description: 'Leave empty when the template body has no variables',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendTemplate'],
				messageTemplateComponentsInputModeRemoved: ['fields'],
				messageTemplateParameterFormat: ['POSITIONAL'],
			},
		},
	},
	{
		displayName: 'Body Parameters',
		name: 'messageTemplateBodyNamedParameters',
		type: 'fixedCollection',
		default: {},
		placeholder: 'Add Body Parameter',
		typeOptions: {
			multipleValues: true,
			sortable: true,
			fixedCollection: {
				itemTitle: '={{ $parameter["name"] || "Body Parameter" }}',
			},
		},
		options: [
			{
				displayName: 'Parameter',
				name: 'parameterValues',
				values: [
					{
						displayName: 'Variable Name',
						name: 'name',
						type: 'string',
						default: '',
						required: true,
						placeholder: 'customer_name',
						description: 'Name used in the approved template',
					},
					{
						displayName: 'Value',
						name: 'value',
						type: 'string',
						default: '',
						required: true,
						description: 'Value sent for this named variable',
					},
				],
			},
		],
		description: 'Leave empty when the template body has no variables',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendTemplate'],
				messageTemplateComponentsInputModeRemoved: ['fields'],
				messageTemplateParameterFormat: ['NAMED'],
			},
		},
	},
	{
		displayName: 'Include Header Parameter',
		name: 'messageTemplateIncludeHeader',
		type: 'boolean',
		default: false,
		description: 'Whether to send a variable or media value for the approved template header',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendTemplate'],
				messageTemplateComponentsInputModeRemoved: ['fields'],
			},
		},
	},
	{
		displayName: 'Header Parameter Type',
		name: 'messageTemplateHeaderType',
		type: 'options',
		noDataExpression: true,
		default: 'text',
		options: [
			{ name: 'Document', value: 'document' },
			{ name: 'Image', value: 'image' },
			{ name: 'Text', value: 'text' },
			{ name: 'Video', value: 'video' },
		],
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendTemplate'],
				messageTemplateComponentsInputModeRemoved: ['fields'],
				messageTemplateIncludeHeader: [true],
			},
		},
	},
	{
		displayName: 'Header Variable Name',
		name: 'messageTemplateHeaderParameterName',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'customer_name',
		description: 'Name used by the text variable in a named template',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendTemplate'],
				messageTemplateComponentsInputModeRemoved: ['fields'],
				messageTemplateIncludeHeader: [true],
				messageTemplateHeaderType: ['text'],
				messageTemplateParameterFormat: ['NAMED'],
			},
		},
	},
	{
		displayName: 'Header Value',
		name: 'messageTemplateHeaderTextValue',
		type: 'string',
		default: '',
		required: true,
		description: 'Value sent for the text variable in the approved header',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendTemplate'],
				messageTemplateComponentsInputModeRemoved: ['fields'],
				messageTemplateIncludeHeader: [true],
				messageTemplateHeaderType: ['text'],
			},
		},
	},
	{
		displayName: 'Header Media URL',
		name: 'messageTemplateHeaderMediaUrl',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'https://example.com/header.jpg',
		description: 'Public HTTP or HTTPS URL of the header media',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendTemplate'],
				messageTemplateComponentsInputModeRemoved: ['fields'],
				messageTemplateIncludeHeader: [true],
				messageTemplateHeaderType: ['document', 'image', 'video'],
			},
		},
	},
	{
		displayName: 'Document Filename',
		name: 'messageTemplateHeaderFilename',
		type: 'string',
		default: '',
		placeholder: 'document.pdf',
		description: 'Optional filename shown to the recipient',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendTemplate'],
				messageTemplateComponentsInputModeRemoved: ['fields'],
				messageTemplateIncludeHeader: [true],
				messageTemplateHeaderType: ['document'],
			},
		},
	},
	{
		displayName: 'Button Parameters',
		name: 'messageTemplateButtonParameters',
		type: 'fixedCollection',
		default: {},
		placeholder: 'Add Button Parameter',
		typeOptions: {
			multipleValues: true,
			sortable: true,
			fixedCollection: {
				itemTitle: '={{ "Button " + ($parameter["index"] ?? 0) }}',
			},
		},
		options: [
			{
				displayName: 'Button Parameter',
				name: 'parameterValues',
				values: [
					{
						displayName: 'Button Type',
						name: 'buttonType',
						type: 'options',
						default: 'url',
						options: [
							{ name: 'Dynamic URL', value: 'url' },
							{ name: 'Quick Reply', value: 'quick_reply' },
						],
						description: 'Type of dynamic button configured in the approved template',
					},
					{
						displayName: 'Button Index',
						name: 'index',
						type: 'number',
						default: 0,
						typeOptions: {
							minValue: 0,
						},
						description: 'Zero-based position of the button in the approved template',
					},
					{
						displayName: 'Value',
						name: 'value',
						type: 'string',
						default: '',
						required: true,
						description: 'Dynamic URL suffix or quick-reply payload',
					},
				],
			},
		],
		description: 'Add only buttons that require a runtime value',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendTemplate'],
				messageTemplateComponentsInputModeRemoved: ['fields'],
			},
		},
	},
	{
		displayName: 'Components JSON',
		name: 'messageTemplateComponentsJson',
		type: 'json',
		default: '[\n  {\n    "type": "body",\n    "parameters": []\n  }\n]',
		required: true,
		description: 'Complete template components and parameters following the Z-API Omni API schema',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendTemplate'],
				messageTemplateComponentsInputModeRemoved: ['json'],
			},
		},
	},
	{
		displayName: 'Components',
		name: 'messageTemplateComponents',
		type: 'json',
		default: '[\n  {\n    "type": "body",\n    "parameters": []\n  }\n]',
		required: true,
		description: 'Template components and their parameters, following the Z-API Omni API schema',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendTemplate'],
			},
		},
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

function getOptions(
	context: IExecuteFunctions,
	name: string,
	itemIndex: number,
	displayName: string,
): IDataObject {
	const value = context.getNodeParameter(name, itemIndex, {});
	if (value === null || typeof value !== 'object' || Array.isArray(value)) {
		throw new NodeOperationError(context.getNode(), `${displayName} must be an object`, {
			itemIndex,
		});
	}

	return value as IDataObject;
}

function getOptionOrLegacyString(
	context: IExecuteFunctions,
	options: IDataObject,
	optionName: string,
	legacyParameterName: string,
	itemIndex: number,
	fallback = '',
): string {
	if (Object.prototype.hasOwnProperty.call(options, optionName)) {
		return String(options[optionName] ?? '').trim();
	}

	return String(context.getNodeParameter(legacyParameterName, itemIndex, fallback) ?? '').trim();
}

function getFixedCollectionItemsFromValue(
	context: IExecuteFunctions,
	itemIndex: number,
	value: unknown,
	collectionName: string,
	displayName: string,
): IDataObject[] {
	if (value === null || typeof value !== 'object' || Array.isArray(value)) {
		throw new NodeOperationError(context.getNode(), `${displayName} must be a collection`, {
			itemIndex,
		});
	}

	const items = (value as IDataObject)[collectionName];
	if (items === undefined) return [];
	if (
		!Array.isArray(items) ||
		items.some((item) => item === null || typeof item !== 'object' || Array.isArray(item))
	) {
		throw new NodeOperationError(context.getNode(), `${displayName} must contain a list of items`, {
			itemIndex,
		});
	}

	return items as IDataObject[];
}

function getFixedCollectionItemsParameter(
	context: IExecuteFunctions,
	itemIndex: number,
	parameterName: string,
	collectionName: string,
	displayName: string,
): IDataObject[] {
	const value = context.getNodeParameter(parameterName, itemIndex, {});
	return getFixedCollectionItemsFromValue(
		context,
		itemIndex,
		value,
		collectionName,
		displayName,
	);
}

function normalizeAndValidatePhoneNumber(
	context: IExecuteFunctions,
	value: string,
	itemIndex: number,
	displayName: string,
): string {
	const normalizedValue = value.replace(/[+\s().-]/gu, '');
	if (!/^\d{1,15}$/u.test(normalizedValue)) {
		throw new NodeOperationError(
			context.getNode(),
			`${displayName} must contain only digits after formatting is removed and have at most 15 digits`,
			{ itemIndex },
		);
	}

	return normalizedValue;
}

function getMessageTarget(
	context: IExecuteFunctions,
	itemIndex: number,
): { channelId: string; recipient: string } {
	const channelId = getRequiredString(context, 'channelId', itemIndex, 'Channel ID');
	const recipient = normalizeAndValidatePhoneNumber(
		context,
		getRequiredString(context, 'recipient', itemIndex, 'Recipient'),
		itemIndex,
		'Recipient',
	);
	return { channelId, recipient };
}

async function sendMessage(
	context: IExecuteFunctions,
	itemIndex: number,
	content: IDataObject,
): Promise<IDataObject> {
	const { channelId, recipient } = getMessageTarget(context, itemIndex);
	return (await zapiOmniApiRequest.call(
		context,
		'POST',
		`/v1/channels/${encodeURIComponent(channelId)}/messages`,
		itemIndex,
		{
			recipient: {
				identifier: recipient,
			},
			content,
		},
	)) as IDataObject;
}

function validateHttpUrl(
	context: IExecuteFunctions,
	value: string,
	itemIndex: number,
	displayName: string,
): void {
	try {
		const parsedUrl = new URL(value);
		if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
			throw new Error('Unsupported protocol');
		}
	} catch {
		throw new NodeOperationError(
			context.getNode(),
			`${displayName} must be a valid HTTP or HTTPS URL`,
			{ itemIndex },
		);
	}
}

function getMediaUrl(context: IExecuteFunctions, itemIndex: number): string {
	const mediaUrl = getRequiredString(context, 'mediaUrl', itemIndex, 'Media URL');
	validateHttpUrl(context, mediaUrl, itemIndex, 'Media URL');

	return mediaUrl;
}

async function sendText(context: IExecuteFunctions, itemIndex: number): Promise<IDataObject> {
	const message = getRequiredString(context, 'message', itemIndex, 'Message');
	return await sendMessage(context, itemIndex, {
		type: 'TEXT',
		body: {
			message,
		},
	});
}

async function sendMedia(
	context: IExecuteFunctions,
	itemIndex: number,
	type: 'AUDIO' | 'IMAGE' | 'STICKER' | 'VIDEO',
): Promise<IDataObject> {
	const attachment: IDataObject = {
		url: getMediaUrl(context, itemIndex),
	};

	if (type === 'IMAGE' || type === 'VIDEO') {
		const mediaOptions = getOptions(context, 'mediaOptions', itemIndex, 'Options');
		const caption = getOptionOrLegacyString(
			context,
			mediaOptions,
			'caption',
			'caption',
			itemIndex,
		);
		if (caption) {
			attachment.caption = caption;
		}
	}

	return await sendMessage(context, itemIndex, {
		type,
		attachments: [attachment],
	});
}

async function sendContact(context: IExecuteFunctions, itemIndex: number): Promise<IDataObject> {
	const name = getRequiredString(context, 'contactName', itemIndex, 'Contact Name');
	const inputMode = String(
		context.getNodeParameter('contactPhonesInputMode', itemIndex, 'fields'),
	);
	let phones: string[];

	if (inputMode === 'fields') {
		phones = getFixedCollectionItemsParameter(
			context,
			itemIndex,
			'contactPhonesUi',
			'phoneValues',
			'Contact Phone Numbers',
		)
			.map((item) => String(item.phone ?? '').trim())
			.filter(Boolean);
	} else if (inputMode === 'list') {
		phones = getRequiredString(context, 'contactPhones', itemIndex, 'Contact Phone Numbers')
			.split(/[,;\n]/u)
			.map((phone) => phone.trim())
			.filter(Boolean);
	} else {
		throw new NodeOperationError(context.getNode(), 'Unsupported contact phone number definition', {
			itemIndex,
		});
	}

	if (phones.length === 0) {
		throw new NodeOperationError(context.getNode(), 'At least one contact phone number is required', {
			itemIndex,
		});
	}

	phones = phones.map((phone) =>
		normalizeAndValidatePhoneNumber(context, phone, itemIndex, 'Each contact phone number'),
	);

	return await sendMessage(context, itemIndex, {
		type: 'CONTACT',
		attachments: [{ name, phones }],
	});
}

function getJsonObjectArrayParameter(
	context: IExecuteFunctions,
	itemIndex: number,
	parameterName: string,
	displayName: string,
): IDataObject[] {
	const rawValue = context.getNodeParameter(parameterName, itemIndex);
	let parsedValue: unknown = rawValue;

	if (typeof rawValue === 'string') {
		try {
			parsedValue = JSON.parse(rawValue);
		} catch (error: unknown) {
			throw new NodeOperationError(context.getNode(), error as Error, {
				itemIndex,
				message: `${displayName} must be valid JSON`,
			});
		}
	}

	if (
		!Array.isArray(parsedValue) ||
		parsedValue.some(
			(component) => component === null || typeof component !== 'object' || Array.isArray(component),
		)
	) {
		throw new NodeOperationError(
			context.getNode(),
			`${displayName} must be a JSON array of objects`,
			{ itemIndex },
		);
	}

	return parsedValue as IDataObject[];
}

function getTemplateComponents(context: IExecuteFunctions, itemIndex: number): IDataObject[] {
	const inputMode = String(
		context.getNodeParameter('messageTemplateComponentsInputMode', itemIndex, 'legacy'),
	);
	if (inputMode === 'legacy') {
		return getJsonObjectArrayParameter(
			context,
			itemIndex,
			'messageTemplateComponents',
			'Components',
		);
	}
	if (inputMode === 'json') {
		return getJsonObjectArrayParameter(
			context,
			itemIndex,
			'messageTemplateComponentsJson',
			'Components JSON',
		);
	}
	if (inputMode !== 'fields') {
		throw new NodeOperationError(context.getNode(), 'Unsupported template parameter definition', {
			itemIndex,
		});
	}

	const legacyComponents = context.getNodeParameter(
		'messageTemplateComponents',
		itemIndex,
		'',
	);
	const hasVisualParameters =
		Boolean(context.getNodeParameter('messageTemplateIncludeHeader', itemIndex, false)) ||
		getFixedCollectionItemsParameter(
			context,
			itemIndex,
			'messageTemplateBodyPositionalParameters',
			'parameterValues',
			'Body Parameters',
		).length > 0 ||
		getFixedCollectionItemsParameter(
			context,
			itemIndex,
			'messageTemplateBodyNamedParameters',
			'parameterValues',
			'Body Parameters',
		).length > 0 ||
		getFixedCollectionItemsParameter(
			context,
			itemIndex,
			'messageTemplateButtonParameters',
			'parameterValues',
			'Button Parameters',
		).length > 0;
	if (!hasVisualParameters && String(legacyComponents ?? '').trim()) {
		return getJsonObjectArrayParameter(
			context,
			itemIndex,
			'messageTemplateComponents',
			'Legacy Components',
		);
	}

	const components: IDataObject[] = [];
	const parameterFormat = String(
		context.getNodeParameter('messageTemplateParameterFormat', itemIndex, 'POSITIONAL'),
	);
	let bodyParameters: IDataObject[];
	if (parameterFormat === 'POSITIONAL') {
		bodyParameters = getFixedCollectionItemsParameter(
			context,
			itemIndex,
			'messageTemplateBodyPositionalParameters',
			'parameterValues',
			'Body Parameters',
		).map((parameter) => {
			const text = String(parameter.value ?? '').trim();
			if (!text) {
				throw new NodeOperationError(
					context.getNode(),
					'Each body parameter requires a value',
					{ itemIndex },
				);
			}
			return { type: 'text', text };
		});
	} else if (parameterFormat === 'NAMED') {
		bodyParameters = getFixedCollectionItemsParameter(
			context,
			itemIndex,
			'messageTemplateBodyNamedParameters',
			'parameterValues',
			'Body Parameters',
		).map((parameter) => {
			const parameterName = String(parameter.name ?? '').trim();
			const text = String(parameter.value ?? '').trim();
			if (!/^[a-z][a-z0-9_]*$/u.test(parameterName) || !text) {
				throw new NodeOperationError(
					context.getNode(),
					'Each named body parameter requires a lowercase variable name and a value',
					{ itemIndex },
				);
			}
			return { type: 'text', parameter_name: parameterName, text };
		});
		const parameterNames = bodyParameters.map((parameter) => String(parameter.parameter_name));
		if (new Set(parameterNames).size !== parameterNames.length) {
			throw new NodeOperationError(
				context.getNode(),
				'Named body parameters must have unique variable names',
				{ itemIndex },
			);
		}
	} else {
		throw new NodeOperationError(context.getNode(), 'Unsupported template variable format', {
			itemIndex,
		});
	}
	if (bodyParameters.length > 0) {
		components.push({ type: 'body', parameters: bodyParameters });
	}

	if (context.getNodeParameter('messageTemplateIncludeHeader', itemIndex, false)) {
		const headerType = String(
			context.getNodeParameter('messageTemplateHeaderType', itemIndex, 'text'),
		);
		let headerParameter: IDataObject;
		if (headerType === 'text') {
			const text = getRequiredString(
				context,
				'messageTemplateHeaderTextValue',
				itemIndex,
				'Header Value',
			);
			headerParameter = { type: 'text', text };
			if (parameterFormat === 'NAMED') {
				const parameterName = getRequiredString(
					context,
					'messageTemplateHeaderParameterName',
					itemIndex,
					'Header Variable Name',
				);
				if (!/^[a-z][a-z0-9_]*$/u.test(parameterName)) {
					throw new NodeOperationError(
						context.getNode(),
						'Header Variable Name must use lowercase letters, numbers, and underscores',
						{ itemIndex },
					);
				}
				headerParameter.parameter_name = parameterName;
			}
		} else if (['document', 'image', 'video'].includes(headerType)) {
			const link = getRequiredString(
				context,
				'messageTemplateHeaderMediaUrl',
				itemIndex,
				'Header Media URL',
			);
			validateHttpUrl(context, link, itemIndex, 'Header Media URL');
			const media: IDataObject = { link };
			if (headerType === 'document') {
				const filename = String(
					context.getNodeParameter('messageTemplateHeaderFilename', itemIndex, ''),
				).trim();
				if (filename) media.filename = filename;
			}
			headerParameter = { type: headerType, [headerType]: media };
		} else {
			throw new NodeOperationError(
				context.getNode(),
				`Unsupported template header parameter type: ${headerType}`,
				{ itemIndex },
			);
		}
		components.push({ type: 'header', parameters: [headerParameter] });
	}

	const buttonParameters = getFixedCollectionItemsParameter(
		context,
		itemIndex,
		'messageTemplateButtonParameters',
		'parameterValues',
		'Button Parameters',
	);
	const buttonKeys = new Set<string>();
	for (const parameter of buttonParameters) {
		const buttonType = String(parameter.buttonType ?? '').trim();
		const index = Number(parameter.index ?? 0);
		const value = String(parameter.value ?? '').trim();
		if (!['quick_reply', 'url'].includes(buttonType) || !Number.isInteger(index) || index < 0) {
			throw new NodeOperationError(context.getNode(), 'Each button requires a valid type and index', {
				itemIndex,
			});
		}
		if (!value) {
			throw new NodeOperationError(context.getNode(), 'Each button parameter requires a value', {
				itemIndex,
			});
		}
		const buttonKey = `${buttonType}:${index}`;
		if (buttonKeys.has(buttonKey)) {
			throw new NodeOperationError(
				context.getNode(),
				'Button parameter type and index combinations must be unique',
				{ itemIndex },
			);
		}
		buttonKeys.add(buttonKey);
		components.push({
			type: 'button',
			sub_type: buttonType,
			index: String(index),
			parameters: [
				buttonType === 'url'
					? { type: 'text', text: value }
					: { type: 'payload', payload: value },
			],
		});
	}

	return components;
}

function getActionButtons(context: IExecuteFunctions, itemIndex: number): IDataObject[] {
	const inputMode = String(
		context.getNodeParameter('actionButtonsInputMode', itemIndex, 'fields'),
	);
	let sourceButtons: IDataObject[];
	if (inputMode === 'json') {
		sourceButtons = getJsonObjectArrayParameter(
			context,
			itemIndex,
			'actionButtons',
			'Action Buttons',
		);
	} else if (inputMode === 'fields') {
		sourceButtons = getFixedCollectionItemsParameter(
			context,
			itemIndex,
			'actionButtonsUi',
			'buttonValues',
			'Action Buttons',
		);
	} else {
		throw new NodeOperationError(context.getNode(), 'Unsupported action button definition', {
			itemIndex,
		});
	}

	return sourceButtons.map((button) => {
		const id = String(button.id ?? '').trim();
		const title = String(button.title ?? '').trim();
		const name = String(
			inputMode === 'fields' ? (button.actionType ?? '') : (button.name ?? ''),
		).trim();
		const result: IDataObject = { id, title, name };

		if (name === 'URL') {
			result.url = String(button.url ?? '').trim();
		} else if (name === 'CALL') {
			const phones = button.phones;
			result.phones = (Array.isArray(phones) ? phones : String(phones ?? '').split(/[,;\n]/u))
				.map((phone) => String(phone).trim())
				.filter(Boolean);
		}

		return result;
	});
}

function getReplyButtons(context: IExecuteFunctions, itemIndex: number): IDataObject[] {
	const inputMode = String(
		context.getNodeParameter('replyButtonsInputMode', itemIndex, 'fields'),
	);
	let sourceButtons: IDataObject[];
	if (inputMode === 'json') {
		sourceButtons = getJsonObjectArrayParameter(
			context,
			itemIndex,
			'replyButtons',
			'Reply Buttons',
		);
	} else if (inputMode === 'fields') {
		sourceButtons = getFixedCollectionItemsParameter(
			context,
			itemIndex,
			'replyButtonsUi',
			'buttonValues',
			'Reply Buttons',
		);
	} else {
		throw new NodeOperationError(context.getNode(), 'Unsupported reply button definition', {
			itemIndex,
		});
	}

	return sourceButtons.map((button) => ({
		id: String(button.id ?? '').trim(),
		title: String(button.title ?? '').trim(),
	}));
}

function validateUniqueButtonIds(
	context: IExecuteFunctions,
	itemIndex: number,
	buttons: IDataObject[],
	displayName: string,
): void {
	const ids = buttons.map((button) => String(button.id ?? '').trim());
	if (new Set(ids).size !== ids.length) {
		throw new NodeOperationError(context.getNode(), `${displayName} must have unique IDs`, {
			itemIndex,
		});
	}
}

async function sendTemplate(context: IExecuteFunctions, itemIndex: number): Promise<IDataObject> {
	const name = getRequiredString(context, 'messageTemplateName', itemIndex, 'Template Name');
	const languageCode = getRequiredString(context, 'languageCode', itemIndex, 'Language Code');
	const components = getTemplateComponents(context, itemIndex);

	return await sendMessage(context, itemIndex, {
		type: 'TEMPLATE',
		attachments: [
			{
				template: {
					name,
					language: {
						policy: 'deterministic',
						code: languageCode,
					},
					components,
				},
			},
		],
	});
}

async function sendInteractiveAction(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<IDataObject> {
	const message = getRequiredString(context, 'interactiveMessage', itemIndex, 'Body Message');
	const options = getOptions(context, 'interactiveActionOptions', itemIndex, 'Options');
	const header = getOptionOrLegacyString(
		context,
		options,
		'header',
		'interactiveHeader',
		itemIndex,
	);
	const footer = getOptionOrLegacyString(
		context,
		options,
		'footer',
		'interactiveFooter',
		itemIndex,
	);
	const buttons = getActionButtons(context, itemIndex);

	if (buttons.length === 0) {
		throw new NodeOperationError(context.getNode(), 'At least one action button is required', {
			itemIndex,
		});
	}

	for (const button of buttons) {
		const type = String(button.name ?? '').trim();
		if (!String(button.id ?? '').trim() || !String(button.title ?? '').trim()) {
			throw new NodeOperationError(context.getNode(), 'Each action button requires an ID and title', {
				itemIndex,
			});
		}

		if (type === 'URL') {
			validateHttpUrl(context, String(button.url ?? ''), itemIndex, 'Action button URL');
		} else if (type === 'CALL') {
			if (!Array.isArray(button.phones) || button.phones.length === 0) {
				throw new NodeOperationError(
					context.getNode(),
					'CALL action buttons require at least one phone number',
					{ itemIndex },
				);
			}
			button.phones = button.phones.map((phone) =>
				normalizeAndValidatePhoneNumber(
					context,
					String(phone),
					itemIndex,
					'Each action button phone number',
				),
			);
		} else {
			throw new NodeOperationError(context.getNode(), 'Action button name must be URL or CALL', {
				itemIndex,
			});
		}
	}
	validateUniqueButtonIds(context, itemIndex, buttons, 'Action Buttons');

	const content: IDataObject = {
		type: 'INTERACTIVE_ACTION',
		body: { message },
		attachments: buttons,
	};
	if (header) content.header = { message: header };
	if (footer) content.footer = { message: footer };
	return await sendMessage(context, itemIndex, content);
}

async function sendInteractiveButton(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<IDataObject> {
	const message = getRequiredString(context, 'interactiveMessage', itemIndex, 'Body Message');
	const buttons = getReplyButtons(context, itemIndex);
	if (buttons.length === 0 || buttons.length > 3) {
		throw new NodeOperationError(context.getNode(), 'Reply Buttons must contain between one and three buttons', {
			itemIndex,
		});
	}
	if (buttons.some((button) => !String(button.id ?? '').trim() || !String(button.title ?? '').trim())) {
		throw new NodeOperationError(context.getNode(), 'Each reply button requires an ID and title', {
			itemIndex,
		});
	}
	validateUniqueButtonIds(context, itemIndex, buttons, 'Reply Buttons');

	const body: IDataObject = { message };
	const options = getOptions(context, 'interactiveButtonOptions', itemIndex, 'Options');
	const usesGroupedThumbnail = Object.prototype.hasOwnProperty.call(options, 'thumbnailUrl');
	const thumbnail = getOptionOrLegacyString(
		context,
		options,
		'thumbnailUrl',
		'thumbnailUrl',
		itemIndex,
	);
	if (thumbnail) {
		validateHttpUrl(context, thumbnail, itemIndex, 'Thumbnail URL');
		body.thumbnail = thumbnail;
		if (
			usesGroupedThumbnail &&
			!Object.prototype.hasOwnProperty.call(options, 'thumbnailMimeType')
		) {
			throw new NodeOperationError(
				context.getNode(),
				'Thumbnail MIME Type is required when Thumbnail URL is set',
				{ itemIndex },
			);
		}
		const mimeType = getOptionOrLegacyString(
			context,
			options,
			'thumbnailMimeType',
			'thumbnailMimeType',
			itemIndex,
			'image/jpeg',
		);
		if (!mimeType) {
			throw new NodeOperationError(context.getNode(), 'Thumbnail MIME Type is required', {
				itemIndex,
			});
		}
		body.mimeType =
			mimeType === 'custom'
				? String(options.thumbnailCustomMimeType ?? '').trim()
				: mimeType;
		if (!body.mimeType) {
			throw new NodeOperationError(context.getNode(), 'Custom Thumbnail MIME Type is required', {
				itemIndex,
			});
		}
		if (!/^[\w.+-]+\/[\w.+-]+$/u.test(String(body.mimeType))) {
			throw new NodeOperationError(
				context.getNode(),
				'Thumbnail MIME Type must use the type/subtype format, such as image/png',
				{ itemIndex },
			);
		}
	}

	return await sendMessage(context, itemIndex, {
		type: 'INTERACTIVE_BUTTON',
		body,
		attachments: buttons,
	});
}

export async function executeMessage(
	this: IExecuteFunctions,
	itemIndex: number,
	operation: ZapiOmniMessageOperation,
): Promise<IDataObject> {
	if (operation === 'sendAudio') {
		return await sendMedia(this, itemIndex, 'AUDIO');
	}

	if (operation === 'sendContact') {
		return await sendContact(this, itemIndex);
	}

	if (operation === 'sendImage') {
		return await sendMedia(this, itemIndex, 'IMAGE');
	}

	if (operation === 'sendInteractiveAction') {
		return await sendInteractiveAction(this, itemIndex);
	}

	if (operation === 'sendInteractiveButton') {
		return await sendInteractiveButton(this, itemIndex);
	}

	if (operation === 'sendSticker') {
		return await sendMedia(this, itemIndex, 'STICKER');
	}

	if (operation === 'sendTemplate') {
		return await sendTemplate(this, itemIndex);
	}

	if (operation === 'sendText') {
		return await sendText(this, itemIndex);
	}

	if (operation === 'sendVideo') {
		return await sendMedia(this, itemIndex, 'VIDEO');
	}

	throw new NodeOperationError(this.getNode(), `Unsupported Message operation: ${String(operation)}`, {
		itemIndex,
	});
}
