import type {
	IDataObject,
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeProperties,
	INodePropertyOptions,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { templateLanguageOptions } from '../../TemplateLanguages';
import { zapiOmniApiRequest } from '../../transport/ZapiOmniApiRequest';
import type { ZapiOmniTemplateOperation } from '../../types';

const BUSINESSES_ENDPOINT = '/whatsapp/businesses';

const operationsWithWaba: ZapiOmniTemplateOperation[] = [
	'create',
	'delete',
	'getMany',
	'sync',
	'update',
];

const operationsWithTemplateBody: ZapiOmniTemplateOperation[] = ['create', 'update'];
const operationsWithTemplateId: ZapiOmniTemplateOperation[] = ['delete', 'update'];

export const templateProperties: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		default: 'getMany',
		displayOptions: {
			show: {
				resource: ['template'],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				action: 'Create a template',
				description: 'Create a WhatsApp message template and submit it for Meta approval',
			},
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete a template',
				description: 'Permanently delete a WhatsApp message template',
			},
			{
				name: 'Get Many',
				value: 'getMany',
				action: 'Get many templates',
				description: 'List the templates registered in a WABA',
			},
			{
				name: 'Get Many WABAs',
				value: 'getManyBusinesses',
				action: 'Get many business accounts',
				description: 'List the WhatsApp Business Accounts available to the credential',
			},
			{
				name: 'Sync',
				value: 'sync',
				action: 'Sync templates',
				description: 'Synchronize template statuses and data with Meta',
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update a template',
				description: 'Update a template and resubmit it for Meta approval',
			},
		],
	},
	{
		displayName: 'WABA Name or ID',
		name: 'wabaId',
		type: 'options',
		typeOptions: {
			loadOptionsMethod: 'getBusinesses',
		},
		default: '',
		required: true,
		description:
			'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
		displayOptions: {
			show: {
				resource: ['template'],
				operation: operationsWithWaba,
			},
		},
	},
	{
		displayName: 'Template Name or ID',
		name: 'templateId',
		type: 'options',
		typeOptions: {
			loadOptionsMethod: 'getTemplates',
			loadOptionsDependsOn: ['wabaId'],
		},
		default: '',
		required: true,
		description:
			'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
		displayOptions: {
			show: {
				resource: ['template'],
				operation: operationsWithTemplateId,
			},
		},
	},
	{
		displayName: 'Deleting a template is permanent. Recreating it requires a new Meta approval.',
		name: 'deleteTemplateNotice',
		type: 'notice',
		default: '',
		displayOptions: {
			show: {
				resource: ['template'],
				operation: ['delete'],
			},
		},
	},
	{
		displayName: 'Name',
		name: 'templateName',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'order_update_v1',
		description: 'Template name in lowercase snake_case; it cannot be changed after creation',
		displayOptions: {
			show: {
				resource: ['template'],
				operation: ['create'],
			},
		},
	},
	{
		displayName:
			'Template names cannot be changed. The selected template keeps its current name; create a new template to use another name.',
		name: 'updateTemplateNameNotice',
		type: 'notice',
		default: '',
		displayOptions: {
			show: {
				resource: ['template'],
				operation: ['update'],
			},
		},
	},
	{
		displayName: 'Category',
		name: 'templateCategory',
		type: 'options',
		default: 'UTILITY',
		required: true,
		options: [
			{
				name: 'Authentication',
				value: 'AUTHENTICATION',
			},
			{
				name: 'Marketing',
				value: 'MARKETING',
			},
			{
				name: 'Utility',
				value: 'UTILITY',
			},
		],
		description: 'Category used by Meta to classify the message template',
		displayOptions: {
			show: {
				resource: ['template'],
				operation: operationsWithTemplateBody,
			},
		},
	},
	{
		displayName: 'Language Code',
		name: 'templateLanguage',
		type: 'options',
		default: 'pt_BR',
		required: true,
		options: templateLanguageOptions,
		description: 'Language of the WhatsApp message template',
		displayOptions: {
			show: {
				resource: ['template'],
				operation: operationsWithTemplateBody,
			},
		},
	},
	{
		displayName: 'Removed Visual Builder Mode',
		name: 'templateComponentsInputModeRemoved',
		type: 'hidden',
		default: 'removed',
		displayOptions: {
			show: {
				resource: ['template'],
				operation: operationsWithTemplateBody,
			},
		},
	},
	{
		displayName:
			'The visual builder currently supports custom templates. Authentication, catalog, carousel, and other specialized templates require different Meta schemas; use JSON mode for those formats.',
		name: 'customTemplateNotice',
		type: 'notice',
		default: '',
		displayOptions: {
			show: {
				resource: ['template'],
				operation: operationsWithTemplateBody,
				templateComponentsInputModeRemoved: ['fields'],
			},
		},
	},
	{
		displayName: 'Template Type',
		name: 'templateType',
		type: 'options',
		noDataExpression: true,
		default: 'custom',
		options: [
			{
				name: 'Custom',
				value: 'custom',
			},
		],
		description: 'Template schema configured by the visual builder',
		displayOptions: {
			show: {
				resource: ['template'],
				operation: operationsWithTemplateBody,
				templateComponentsInputModeRemoved: ['fields'],
			},
		},
	},
	{
		displayName: 'Variable Format',
		name: 'templateParameterFormat',
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
		description: 'How variables are identified in the template text',
		displayOptions: {
			show: {
				resource: ['template'],
				operation: operationsWithTemplateBody,
				templateComponentsInputModeRemoved: ['fields'],
			},
		},
	},
	{
		displayName: 'Allow Category Change',
		name: 'templateAllowCategoryChange',
		type: 'boolean',
		default: true,
		description:
			'Whether Meta may automatically move the template to the category it considers correct',
		displayOptions: {
			show: {
				resource: ['template'],
				operation: operationsWithTemplateBody,
				templateComponentsInputModeRemoved: ['fields'],
			},
		},
	},
	{
		displayName: 'Body Text',
		name: 'templateBodyText',
		type: 'string',
		typeOptions: {
			rows: 5,
		},
		default: '',
		placeholder: 'Hello {{1}}, your order {{2}} is ready.',
		description: 'Main template text. Variables cannot be placed at the start or end.',
		displayOptions: {
			show: {
				resource: ['template'],
				operation: operationsWithTemplateBody,
				templateComponentsInputModeRemoved: ['fields'],
			},
		},
	},
	{
		displayName: 'Body Variable Examples',
		name: 'templateBodyPositionalExamples',
		type: 'fixedCollection',
		default: {},
		placeholder: 'Add Example',
		typeOptions: {
			multipleValues: true,
			sortable: true,
			fixedCollection: {
				itemTitle: '={{ $parameter["value"] || "Example" }}',
			},
		},
		options: [
			{
				displayName: 'Example',
				name: 'exampleValues',
				values: [
					{
						displayName: 'Value',
						name: 'value',
						type: 'string',
						default: '',
						required: true,
						description: 'Example value for the variable in the same position',
					},
				],
			},
		],
		description: 'Add one example for each positional variable, in numeric order',
		displayOptions: {
			show: {
				resource: ['template'],
				operation: operationsWithTemplateBody,
				templateComponentsInputModeRemoved: ['fields'],
				templateParameterFormat: ['POSITIONAL'],
			},
		},
	},
	{
		displayName: 'Body Variable Examples',
		name: 'templateBodyNamedExamples',
		type: 'fixedCollection',
		default: {},
		placeholder: 'Add Example',
		typeOptions: {
			multipleValues: true,
			sortable: true,
			fixedCollection: {
				itemTitle: '={{ $parameter["name"] || "Example" }}',
			},
		},
		options: [
			{
				displayName: 'Example',
				name: 'exampleValues',
				values: [
					{
						displayName: 'Variable Name',
						name: 'name',
						type: 'string',
						default: '',
						required: true,
						placeholder: 'customer_name',
						description: 'Name used inside {{variable_name}}',
					},
					{
						displayName: 'Value',
						name: 'value',
						type: 'string',
						default: '',
						required: true,
						description: 'Example value submitted to Meta',
					},
				],
			},
		],
		description: 'Add one example for every named variable used in the body',
		displayOptions: {
			show: {
				resource: ['template'],
				operation: operationsWithTemplateBody,
				templateComponentsInputModeRemoved: ['fields'],
				templateParameterFormat: ['NAMED'],
			},
		},
	},
	{
		displayName: 'Include Header',
		name: 'templateIncludeHeader',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['template'],
				operation: operationsWithTemplateBody,
				templateComponentsInputModeRemoved: ['fields'],
			},
		},
	},
	{
		displayName: 'Header Format',
		name: 'templateHeaderFormat',
		type: 'options',
		noDataExpression: true,
		default: 'TEXT',
		options: [
			{ name: 'Document', value: 'DOCUMENT' },
			{ name: 'Image', value: 'IMAGE' },
			{ name: 'Location', value: 'LOCATION' },
			{ name: 'Text', value: 'TEXT' },
			{ name: 'Video', value: 'VIDEO' },
		],
		displayOptions: {
			show: {
				resource: ['template'],
				operation: operationsWithTemplateBody,
				templateComponentsInputModeRemoved: ['fields'],
				templateIncludeHeader: [true],
			},
		},
	},
	{
		displayName: 'Header Text',
		name: 'templateHeaderText',
		type: 'string',
		default: '',
		placeholder: 'Order update for {{1}}',
		description: 'Text header; Meta permits at most one variable',
		displayOptions: {
			show: {
				resource: ['template'],
				operation: operationsWithTemplateBody,
				templateComponentsInputModeRemoved: ['fields'],
				templateIncludeHeader: [true],
				templateHeaderFormat: ['TEXT'],
			},
		},
	},
	{
		displayName: 'Header Variable Example',
		name: 'templateHeaderExample',
		type: 'string',
		default: '',
		description: 'Example value required when the text header contains a variable',
		displayOptions: {
			show: {
				resource: ['template'],
				operation: operationsWithTemplateBody,
				templateComponentsInputModeRemoved: ['fields'],
				templateIncludeHeader: [true],
				templateHeaderFormat: ['TEXT'],
			},
		},
	},
	{
		displayName: 'Header Handle',
		name: 'templateHeaderHandle',
		type: 'string',
		default: '',
		required: true,
		description: 'Meta resumable-upload handle used as the media header example',
		displayOptions: {
			show: {
				resource: ['template'],
				operation: operationsWithTemplateBody,
				templateComponentsInputModeRemoved: ['fields'],
				templateIncludeHeader: [true],
				templateHeaderFormat: ['DOCUMENT', 'IMAGE', 'VIDEO'],
			},
		},
	},
	{
		displayName: 'Include Footer',
		name: 'templateIncludeFooter',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['template'],
				operation: operationsWithTemplateBody,
				templateComponentsInputModeRemoved: ['fields'],
			},
		},
	},
	{
		displayName: 'Footer Text',
		name: 'templateFooterText',
		type: 'string',
		default: '',
		description: 'Static footer text; footer variables are not supported by Meta',
		displayOptions: {
			show: {
				resource: ['template'],
				operation: operationsWithTemplateBody,
				templateComponentsInputModeRemoved: ['fields'],
				templateIncludeFooter: [true],
			},
		},
	},
	{
		displayName: 'Buttons',
		name: 'templateButtons',
		type: 'fixedCollection',
		default: {},
		placeholder: 'Add Button',
		typeOptions: {
			multipleValues: true,
			sortable: true,
			fixedCollection: {
				itemTitle: '={{ $parameter["text"] || "Button" }}',
			},
		},
		options: [
			{
				displayName: 'Button',
				name: 'buttonValues',
				values: [
					{
						displayName: 'Dynamic URL Example',
						name: 'urlExample',
						type: 'string',
						default: '',
						description: 'Complete example URL when the button URL contains {{1}}',
						displayOptions: {
							show: {
								buttonType: ['URL'],
							},
						},
					},
					{
						displayName: 'Phone Number',
						name: 'phoneNumber',
						type: 'string',
						default: '',
						required: true,
						placeholder: '+5511999999999',
						description: 'Phone number called by the template button',
						displayOptions: {
							show: {
								buttonType: ['PHONE_NUMBER'],
							},
						},
					},
					{
						displayName: 'Text',
						name: 'text',
						type: 'string',
						default: '',
						required: true,
						description: 'Label displayed on the button',
					},
					{
						displayName: 'Type',
						name: 'buttonType',
						type: 'options',
						default: 'QUICK_REPLY',
						options: [
							{ name: 'Call Phone Number', value: 'PHONE_NUMBER' },
							{ name: 'Open URL', value: 'URL' },
							{ name: 'Quick Reply', value: 'QUICK_REPLY' },
						],
					},
					{
						displayName: 'URL',
						name: 'url',
						type: 'string',
						default: '',
						required: true,
						placeholder: 'https://example.com/order/{{1}}',
						description: 'Static or dynamic HTTPS URL',
						displayOptions: {
							show: {
								buttonType: ['URL'],
							},
						},
					},
				],
			},
		],
		description: 'Optional quick-reply, URL, or phone-number buttons',
		displayOptions: {
			show: {
				resource: ['template'],
				operation: operationsWithTemplateBody,
				templateComponentsInputModeRemoved: ['fields'],
			},
		},
	},
	{
		displayName: 'Components JSON',
		name: 'templateComponentsJson',
		type: 'json',
		default:
			'[\n  {\n    "type": "BODY",\n    "text": "Hello {{1}}",\n    "example": {\n      "body_text": [["Ana"]]\n    }\n  }\n]',
		required: true,
		description: 'Complete JSON array of HEADER, BODY, FOOTER, or BUTTONS components',
		displayOptions: {
			show: {
				resource: ['template'],
				operation: operationsWithTemplateBody,
				templateComponentsInputModeRemoved: ['json'],
			},
		},
	},
	{
		displayName: 'Components',
		name: 'templateComponents',
		type: 'json',
		default:
			'[\n  {\n    "type": "BODY",\n    "text": "Hello {{1}}",\n    "example": {\n      "body_text": [["Ana"]]\n    }\n  }\n]',
		required: true,
		description: 'JSON array of HEADER, BODY, FOOTER, or BUTTONS components accepted by Meta',
		displayOptions: {
			show: {
				resource: ['template'],
				operation: operationsWithTemplateBody,
			},
		},
	},
];

function asDataObject(value: unknown): IDataObject | undefined {
	if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
		return value as IDataObject;
	}

	return undefined;
}

function asDataObjectArray(value: unknown): IDataObject[] | undefined {
	if (!Array.isArray(value)) {
		return undefined;
	}

	const items = value.map(asDataObject);
	if (items.some((item) => item === undefined)) {
		return undefined;
	}

	return items as IDataObject[];
}

function extractObjectArray(
	response: unknown,
	keys: string[],
	displayName: string,
): IDataObject[] {
	const directItems = asDataObjectArray(response);
	if (directItems !== undefined) {
		return directItems;
	}

	const envelope = asDataObject(response);
	if (envelope === undefined) {
		throw new Error(`${displayName} response must be an array or an object containing an array`);
	}

	for (const key of keys) {
		if (!Object.prototype.hasOwnProperty.call(envelope, key)) continue;
		const items = asDataObjectArray(envelope[key]);
		if (items === undefined) {
			throw new Error(`${displayName} response field "${key}" must be an array`);
		}
		return items;
	}

	throw new Error(`${displayName} response does not contain a recognized array field`);
}

export function extractBusinesses(response: unknown): IDataObject[] {
	return extractObjectArray(response, ['businesses', 'items', 'results', 'data'], 'Businesses');
}

export function extractTemplates(response: unknown): IDataObject[] {
	return extractObjectArray(response, ['templates', 'items', 'results', 'data'], 'Templates');
}

async function requestBusinesses(
	context: IExecuteFunctions | ILoadOptionsFunctions,
	itemIndex = 0,
): Promise<IDataObject[]> {
	const response = await zapiOmniApiRequest.call(
		context,
		'GET',
		BUSINESSES_ENDPOINT,
		itemIndex,
	);
	try {
		return extractBusinesses(response);
	} catch (error: unknown) {
		throw new NodeOperationError(context.getNode(), error as Error, { itemIndex });
	}
}

async function requestTemplates(
	context: IExecuteFunctions | ILoadOptionsFunctions,
	wabaId: string,
	itemIndex: number,
): Promise<IDataObject[]> {
	const response = await zapiOmniApiRequest.call(
		context,
		'GET',
		`/whatsapp/businesses/${encodeURIComponent(wabaId)}/templates`,
		itemIndex,
	);
	try {
		return extractTemplates(response);
	} catch (error: unknown) {
		throw new NodeOperationError(context.getNode(), error as Error, { itemIndex });
	}
}

export async function loadBusinessOptions(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	const businesses = await requestBusinesses(this);

	return businesses
		.map((business) => {
			const value = String(business.businessId ?? business.id ?? '').trim();
			const name = String(business.name ?? value).trim();
			const channelsCount = Number(business.channelsCount ?? 0);
			const connectedCount = Number(business.connectedCount ?? 0);
			return {
				name,
				value,
				description: `${value} | ${connectedCount}/${channelsCount} connected channels`,
			};
		})
		.filter((option) => option.value.length > 0)
		.sort((first, second) => first.name.localeCompare(second.name));
}

export async function loadTemplateOptions(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	const wabaId = String(this.getCurrentNodeParameter('wabaId') ?? '').trim();
	if (!wabaId || wabaId.startsWith('=')) {
		return [];
	}

	const templates = await requestTemplates(this, wabaId, 0);
	return templates
		.map((template) => {
			const value = String(template.id ?? template.templateId ?? '').trim();
			const name = String(template.name ?? value).trim();
			const language = String(template.language ?? '').trim();
			const category = String(template.category ?? '').trim();
			const status = String(template.status ?? '').trim();
			return {
				name: language ? `${name} (${language})` : name,
				value,
				description: [value, category, status].filter(Boolean).join(' | '),
			};
		})
		.filter((option) => option.value.length > 0)
		.sort((first, second) => first.name.localeCompare(second.name));
}

export async function loadMessageTemplateOptions(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	const businesses = await requestBusinesses(this);
	const templatesByBusiness = await Promise.all(
		businesses.map(async (business) => {
			const wabaId = String(business.businessId ?? business.id ?? '').trim();
			if (!wabaId) return [];
			const businessName = String(business.name ?? wabaId).trim();
			const templates = await requestTemplates(this, wabaId, 0);
			return templates.map((template) => ({ template, wabaId, businessName }));
		}),
	);

	return templatesByBusiness
		.flat()
		.map(({ template, wabaId, businessName }) => {
			const value = String(template.name ?? '').trim();
			const templateId = String(template.id ?? template.templateId ?? '').trim();
			const language = String(template.language ?? '').trim();
			const category = String(template.category ?? '').trim();
			const status = String(template.status ?? '').trim().toUpperCase();
			return {
				name: [value, language && `(${language})`, status && `— ${status}`]
					.filter(Boolean)
					.join(' '),
				value,
				disabled: status !== 'APPROVED',
				description: [businessName, `WABA ${wabaId}`, templateId, category]
					.filter(Boolean)
					.join(' | '),
			};
		})
		.filter((option) => option.value.length > 0)
		.sort((first, second) => {
			if (first.disabled !== second.disabled) return first.disabled ? 1 : -1;
			return first.name.localeCompare(second.name);
		});
}

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

function getFixedCollectionItems(
	context: IExecuteFunctions,
	itemIndex: number,
	parameterName: string,
	collectionName: string,
	displayName: string,
): IDataObject[] {
	const value = context.getNodeParameter(parameterName, itemIndex, {});
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

function parseTemplateComponents(
	context: IExecuteFunctions,
	itemIndex: number,
	rawValue: unknown,
	displayName: string,
): IDataObject[] {
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

	const components = asDataObjectArray(parsedValue);
	if (components === undefined || components.length === 0) {
		throw new NodeOperationError(
			context.getNode(),
			`${displayName} must be a non-empty JSON array`,
			{ itemIndex },
		);
	}

	return components;
}

function getTemplateVariables(
	context: IExecuteFunctions,
	itemIndex: number,
	text: string,
	parameterFormat: string,
	displayName: string,
): string[] {
	const placeholders = [...text.matchAll(/\{\{([^{}]+)\}\}/gu)].map((match) => match[1].trim());
	if (placeholders.length === 0) return [];

	if (text.trimStart().startsWith('{{') || text.trimEnd().endsWith('}}')) {
		throw new NodeOperationError(
			context.getNode(),
			`${displayName} variables cannot be placed at the start or end of the text`,
			{ itemIndex },
		);
	}

	if (parameterFormat === 'POSITIONAL') {
		if (placeholders.some((placeholder) => !/^\d+$/u.test(placeholder))) {
			throw new NodeOperationError(
				context.getNode(),
				`${displayName} must use positional variables such as {{1}} and {{2}}`,
				{ itemIndex },
			);
		}

		const uniqueNumbers = [...new Set(placeholders.map(Number))].sort((first, second) => first - second);
		if (uniqueNumbers.some((value, index) => value !== index + 1)) {
			throw new NodeOperationError(
				context.getNode(),
				`${displayName} positional variables must be sequential, starting at {{1}}`,
				{ itemIndex },
			);
		}
		return uniqueNumbers.map(String);
	}

	if (placeholders.some((placeholder) => !/^[a-z][a-z0-9_]*$/u.test(placeholder))) {
		throw new NodeOperationError(
			context.getNode(),
			`${displayName} named variables must use lowercase letters, numbers, and underscores`,
			{ itemIndex },
		);
	}

	return [...new Set(placeholders)];
}

function getTemplateBodyExamples(
	context: IExecuteFunctions,
	itemIndex: number,
	variables: string[],
	parameterFormat: string,
): IDataObject | undefined {
	if (variables.length === 0) return undefined;

	if (parameterFormat === 'POSITIONAL') {
		const examples = getFixedCollectionItems(
			context,
			itemIndex,
			'templateBodyPositionalExamples',
			'exampleValues',
			'Body Variable Examples',
		).map((item) => String(item.value ?? '').trim());
		if (examples.length !== variables.length || examples.some((example) => !example)) {
			throw new NodeOperationError(
				context.getNode(),
				`Body Variable Examples must contain exactly ${variables.length} non-empty value(s)`,
				{ itemIndex },
			);
		}
		return { body_text: [examples] };
	}

	const examples = getFixedCollectionItems(
		context,
		itemIndex,
		'templateBodyNamedExamples',
		'exampleValues',
		'Body Variable Examples',
	).map((item) => ({
		param_name: String(item.name ?? '').trim(),
		example: String(item.value ?? '').trim(),
	}));
	const exampleNames = examples.map((example) => String(example.param_name));
	if (
		examples.some((example) => !example.param_name || !example.example) ||
		new Set(exampleNames).size !== exampleNames.length ||
		exampleNames.length !== variables.length ||
		variables.some((variable) => !exampleNames.includes(variable))
	) {
		throw new NodeOperationError(
			context.getNode(),
			'Body Variable Examples must contain one unique, non-empty example for every named variable',
			{ itemIndex },
		);
	}

	return { body_text_named_params: examples };
}

function buildVisualTemplateComponents(
	context: IExecuteFunctions,
	itemIndex: number,
	parameterFormat: string,
): IDataObject[] {
	const components: IDataObject[] = [];
	const bodyText = getRequiredString(context, 'templateBodyText', itemIndex, 'Body Text');
	const bodyVariables = getTemplateVariables(
		context,
		itemIndex,
		bodyText,
		parameterFormat,
		'Body Text',
	);
	const body: IDataObject = {
		type: 'BODY',
		text: bodyText,
	};
	const bodyExample = getTemplateBodyExamples(
		context,
		itemIndex,
		bodyVariables,
		parameterFormat,
	);
	if (bodyExample !== undefined) body.example = bodyExample;

	const includeHeader = Boolean(
		context.getNodeParameter('templateIncludeHeader', itemIndex, false),
	);
	if (includeHeader) {
		const format = getRequiredString(context, 'templateHeaderFormat', itemIndex, 'Header Format');
		const header: IDataObject = { type: 'HEADER', format };
		if (format === 'TEXT') {
			const headerText = getRequiredString(context, 'templateHeaderText', itemIndex, 'Header Text');
			const headerVariables = getTemplateVariables(
				context,
				itemIndex,
				headerText,
				parameterFormat,
				'Header Text',
			);
			if (headerVariables.length > 1) {
				throw new NodeOperationError(
					context.getNode(),
					'Header Text supports at most one unique variable',
					{ itemIndex },
				);
			}
			header.text = headerText;
			if (headerVariables.length === 1) {
				const example = getRequiredString(
					context,
					'templateHeaderExample',
					itemIndex,
					'Header Variable Example',
				);
				header.example =
					parameterFormat === 'POSITIONAL'
						? { header_text: [example] }
						: {
								header_text_named_params: [
									{ param_name: headerVariables[0], example },
								],
							};
			}
		} else if (['DOCUMENT', 'IMAGE', 'VIDEO'].includes(format)) {
			header.example = {
				header_handle: [
					getRequiredString(context, 'templateHeaderHandle', itemIndex, 'Header Handle'),
				],
			};
		} else if (format !== 'LOCATION') {
			throw new NodeOperationError(context.getNode(), `Unsupported Header Format: ${format}`, {
				itemIndex,
			});
		}
		components.push(header);
	}

	components.push(body);

	if (context.getNodeParameter('templateIncludeFooter', itemIndex, false)) {
		const footerText = getRequiredString(context, 'templateFooterText', itemIndex, 'Footer Text');
		if (/\{\{[^{}]+\}\}/u.test(footerText)) {
			throw new NodeOperationError(context.getNode(), 'Footer Text cannot contain variables', {
				itemIndex,
			});
		}
		components.push({ type: 'FOOTER', text: footerText });
	}

	const sourceButtons = getFixedCollectionItems(
		context,
		itemIndex,
		'templateButtons',
		'buttonValues',
		'Buttons',
	);
	if (sourceButtons.length > 10) {
		throw new NodeOperationError(context.getNode(), 'Templates support at most 10 buttons', {
			itemIndex,
		});
	}
	if (sourceButtons.length > 0) {
		const buttons = sourceButtons.map((sourceButton) => {
			const type = String(sourceButton.buttonType ?? '').trim();
			const text = String(sourceButton.text ?? '').trim();
			if (!text) {
				throw new NodeOperationError(context.getNode(), 'Each button requires text', { itemIndex });
			}

			if (type === 'QUICK_REPLY') return { type, text };
			if (type === 'PHONE_NUMBER') {
				const phoneNumber = String(sourceButton.phoneNumber ?? '').trim();
				if (!/^\+?\d{7,15}$/u.test(phoneNumber)) {
					throw new NodeOperationError(
						context.getNode(),
						'Each phone-number button requires 7 to 15 digits and may start with +',
						{ itemIndex },
					);
				}
				return { type, text, phone_number: phoneNumber };
			}
			if (type === 'URL') {
				const url = String(sourceButton.url ?? '').trim();
				try {
					const parsedUrl = new URL(url.replace(/\{\{1\}\}/gu, 'example'));
					if (!['http:', 'https:'].includes(parsedUrl.protocol)) throw new Error();
				} catch {
					throw new NodeOperationError(
						context.getNode(),
						'Each URL button requires a valid HTTP or HTTPS URL',
						{ itemIndex },
					);
				}
				const button: IDataObject = { type, text, url };
				return button;
			}

			throw new NodeOperationError(context.getNode(), `Unsupported button type: ${type}`, {
				itemIndex,
			});
		});

		for (let index = 0; index < buttons.length; index++) {
			const sourceButton = sourceButtons[index];
			const button = buttons[index];
			if (button.type === 'URL' && String(button.url).includes('{{1}}')) {
				const example = String(sourceButton.urlExample ?? '').trim();
				if (!example) {
					throw new NodeOperationError(
						context.getNode(),
						'Dynamic URL Example is required for dynamic URL buttons',
						{ itemIndex },
					);
				}
				button.example = [example];
			}
		}
		components.push({ type: 'BUTTONS', buttons });
	}

	return components;
}

function getTemplateDefinition(
	context: IExecuteFunctions,
	itemIndex: number,
): { components: IDataObject[]; legacy: boolean } {
	const inputMode = String(
		context.getNodeParameter('templateComponentsInputMode', itemIndex, 'legacy'),
	);
	if (inputMode === 'legacy') {
		return {
			components: parseTemplateComponents(
				context,
				itemIndex,
				context.getNodeParameter('templateComponents', itemIndex),
				'Components',
			),
			legacy: true,
		};
	}
	if (inputMode === 'json') {
		return {
			components: parseTemplateComponents(
				context,
				itemIndex,
				context.getNodeParameter('templateComponentsJson', itemIndex),
				'Components JSON',
			),
			legacy: false,
		};
	}
	if (inputMode !== 'fields') {
		throw new NodeOperationError(context.getNode(), 'Unsupported component definition', {
			itemIndex,
		});
	}

	const bodyText = String(context.getNodeParameter('templateBodyText', itemIndex, '')).trim();
	const legacyComponents = context.getNodeParameter('templateComponents', itemIndex, '');
	if (!bodyText && String(legacyComponents ?? '').trim()) {
		return {
			components: parseTemplateComponents(
				context,
				itemIndex,
				legacyComponents,
				'Legacy Components',
			),
			legacy: true,
		};
	}

	const parameterFormat = getRequiredString(
		context,
		'templateParameterFormat',
		itemIndex,
		'Variable Format',
	);
	return {
		components: buildVisualTemplateComponents(context, itemIndex, parameterFormat),
		legacy: false,
	};
}

function getTemplateBody(
	context: IExecuteFunctions,
	itemIndex: number,
	currentTemplateName?: string,
): IDataObject {
	const name =
		currentTemplateName ?? getRequiredString(context, 'templateName', itemIndex, 'Name');
	if (!/^[a-z0-9]+(?:_[a-z0-9]+)*$/u.test(name)) {
		throw new NodeOperationError(
			context.getNode(),
			'Name must use lowercase snake_case without spaces or special characters',
			{ itemIndex },
		);
	}

	const definition = getTemplateDefinition(context, itemIndex);
	const body: IDataObject = {
		name,
		category: getRequiredString(context, 'templateCategory', itemIndex, 'Category'),
		language: getRequiredString(context, 'templateLanguage', itemIndex, 'Language Code'),
		components: definition.components,
	};
	if (!definition.legacy) {
		body.parameter_format = getRequiredString(
			context,
			'templateParameterFormat',
			itemIndex,
			'Variable Format',
		);
		body.allow_category_change = Boolean(
			context.getNodeParameter('templateAllowCategoryChange', itemIndex, true),
		);
	}
	return body;
}

async function getCurrentTemplateName(
	context: IExecuteFunctions,
	wabaId: string,
	templateId: string,
	itemIndex: number,
): Promise<string> {
	const templates = await requestTemplates(context, wabaId, itemIndex);
	const selectedTemplate = templates.find(
		(template) => String(template.id ?? template.templateId ?? '').trim() === templateId,
	);

	if (selectedTemplate === undefined) {
		throw new NodeOperationError(
			context.getNode(),
			`Template ID "${templateId}" was not found in the selected WABA`,
			{ itemIndex },
		);
	}

	const name = String(selectedTemplate.name ?? '').trim();
	if (!name) {
		throw new NodeOperationError(
			context.getNode(),
			`Template ID "${templateId}" does not have a name`,
			{ itemIndex },
		);
	}

	return name;
}

function getWabaId(context: IExecuteFunctions, itemIndex: number): string {
	return getRequiredString(context, 'wabaId', itemIndex, 'WABA ID');
}

function getTemplatesEndpoint(wabaId: string): string {
	return `/whatsapp/businesses/${encodeURIComponent(wabaId)}/templates`;
}

export async function executeTemplate(
	this: IExecuteFunctions,
	itemIndex: number,
	operation: ZapiOmniTemplateOperation,
): Promise<IDataObject[]> {
	if (operation === 'getManyBusinesses') {
		return await requestBusinesses(this, itemIndex);
	}

	const wabaId = getWabaId(this, itemIndex);
	const templatesEndpoint = getTemplatesEndpoint(wabaId);

	if (operation === 'create') {
		const response = await zapiOmniApiRequest.call(
			this,
			'POST',
			templatesEndpoint,
			itemIndex,
			getTemplateBody(this, itemIndex),
		);
		return [response as IDataObject];
	}

	if (operation === 'getMany') {
		return await requestTemplates(this, wabaId, itemIndex);
	}

	if (operation === 'sync') {
		const response = await zapiOmniApiRequest.call(
			this,
			'POST',
			`${templatesEndpoint}/sync`,
			itemIndex,
		);
		return [response as IDataObject];
	}

	if (operation === 'delete') {
		const templateId = getRequiredString(this, 'templateId', itemIndex, 'Template ID');
		const endpoint = `${templatesEndpoint}/${encodeURIComponent(templateId)}`;
		const response = await zapiOmniApiRequest.call(
			this,
			'DELETE',
			endpoint,
			itemIndex,
		);
		return [response as IDataObject];
	}

	if (operation === 'update') {
		const templateId = getRequiredString(this, 'templateId', itemIndex, 'Template ID');
		const currentTemplateName = await getCurrentTemplateName(
			this,
			wabaId,
			templateId,
			itemIndex,
		);
		const endpoint = `${templatesEndpoint}/${encodeURIComponent(templateId)}`;
		const response = await zapiOmniApiRequest.call(
			this,
			'PUT',
			endpoint,
			itemIndex,
			getTemplateBody(this, itemIndex, currentTemplateName),
		);
		return [response as IDataObject];
	}

	throw new NodeOperationError(
		this.getNode(),
		`Unsupported Template operation: ${String(operation)}`,
		{ itemIndex },
	);
}
