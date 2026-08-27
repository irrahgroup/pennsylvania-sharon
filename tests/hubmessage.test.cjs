const assert = require('node:assert/strict');
const test = require('node:test');

const { NodeHelpers } = require('n8n-workflow');

const { HubMessageApi } = require('../dist/credentials/HubMessageApi.credentials.js');
const { HubMessage } = require('../dist/nodes/HubMessage/HubMessage.node.js');
const {
	executeChannel,
} = require('../dist/nodes/HubMessage/resources/channel/Channel.resource.js');
const {
	executeMessage,
} = require('../dist/nodes/HubMessage/resources/message/Message.resource.js');
const {
	executeTemplate,
	extractBusinesses,
	extractTemplates,
	loadBusinessOptions,
	loadMessageTemplateOptions,
	loadTemplateOptions,
} = require('../dist/nodes/HubMessage/resources/template/Template.resource.js');


function normalizeParameters(rawParameters, description, itemIndex) {
	const node = {
		id: `hubmessage-test-node-${itemIndex}`,
		name: 'HubMessage',
		type: 'n8n-nodes-hubmessage.hubMessage',
		typeVersion: 1,
		position: [0, 0],
		parameters: rawParameters,
	};

	return {
		node,
		parameters:
			NodeHelpers.getNodeParameters(
				description.properties,
				rawParameters,
				true,
				false,
				node,
				description,
			) ?? {},
	};
}

function createContext(rawParametersOrItems, requestHandler) {
	const description = new HubMessage().description;
	const rawParameterItems = Array.isArray(rawParametersOrItems)
		? rawParametersOrItems
		: [rawParametersOrItems];
	const normalizedItems = rawParameterItems.map((parameters, itemIndex) =>
		normalizeParameters(parameters, description, itemIndex),
	);
	const node = {
		...normalizedItems[0].node,
		parameters: normalizedItems[0].parameters,
	};

	return {
		getNodeParameter(name, itemIndex, fallback) {
			const parameters = normalizedItems[itemIndex]?.parameters ?? normalizedItems[0].parameters;
			return parameters[name] === undefined ? fallback : parameters[name];
		},
		getCurrentNodeParameter(name) {
			return normalizedItems[0].parameters[name];
		},
		async getCredentials(name) {
			assert.equal(name, 'hubMessageApi');
			return {
				baseUrl: 'https://api.hubmessage.io/',
				secretKey: 'test-secret',
			};
		},
		getNode() {
			return node;
		},
		helpers: {
			httpRequestWithAuthentication: requestHandler,
		},
	};
}

function createExecuteContext(rawParameters, recipients, requestHandler, continueOnFail) {
	const parameterItems = recipients.map((recipient) => ({ ...rawParameters, recipient }));
	const baseContext = createContext(parameterItems, requestHandler);
	return {
		...baseContext,
		getInputData() {
			return recipients.map((recipient) => ({ json: { recipient } }));
		},
		continueOnFail() {
			return continueOnFail;
		},
	};
}

test('resource selector is separated into Channel, Message, and Template', () => {
	const description = new HubMessage().description;
	const resource = description.properties.find((property) => property.name === 'resource');

	assert.ok(resource);
	assert.deepEqual(
		resource.options.map((option) => option.value),
		['channel', 'message', 'template'],
	);

	const channelOperation = description.properties.find(
		(property) =>
			property.name === 'operation' && property.displayOptions?.show?.resource?.includes('channel'),
	);

	assert.ok(channelOperation);
	assert.deepEqual(
		channelOperation.options.map((option) => option.value),
		['connect', 'create'],
	);

	const messageOperation = description.properties.find(
		(property) =>
			property.name === 'operation' && property.displayOptions?.show?.resource?.includes('message'),
	);

	assert.ok(messageOperation);
	assert.deepEqual(
		messageOperation.options.map((option) => option.value),
		[
			'sendAudio',
			'sendContact',
			'sendImage',
			'sendInteractiveAction',
			'sendInteractiveButton',
			'sendSticker',
			'sendTemplate',
			'sendText',
			'sendVideo',
		],
	);

	const channelSelector = description.properties.find(
		(property) =>
			property.name === 'channelId' &&
			property.displayOptions?.show?.resource?.includes('message'),
	);
	assert.ok(channelSelector);
	assert.equal(channelSelector.displayName, 'Channel ID');
	assert.equal(channelSelector.type, 'string');
	assert.equal(channelSelector.required, true);
	assert.equal(channelSelector.typeOptions, undefined);

	const templateOperation = description.properties.find(
		(property) =>
			property.name === 'operation' && property.displayOptions?.show?.resource?.includes('template'),
	);

	assert.ok(templateOperation);
	assert.deepEqual(
		templateOperation.options.map((option) => option.value),
		['create', 'delete', 'getMany', 'getManyBusinesses', 'sync', 'update'],
	);

	const wabaSelector = description.properties.find(
		(property) =>
			property.name === 'wabaId' &&
			property.displayOptions?.show?.resource?.includes('template'),
	);
	assert.ok(wabaSelector);
	assert.equal(wabaSelector.typeOptions.loadOptionsMethod, 'getBusinesses');

	const templateSelector = description.properties.find(
		(property) =>
			property.name === 'templateId' &&
			property.displayOptions?.show?.resource?.includes('template'),
	);
	assert.ok(templateSelector);
	assert.equal(templateSelector.typeOptions.loadOptionsMethod, 'getTemplates');
	assert.deepEqual(templateSelector.typeOptions.loadOptionsDependsOn, ['wabaId']);

	const templateName = description.properties.find(
		(property) => property.name === 'templateName',
	);
	const updateTemplateNameNotice = description.properties.find(
		(property) => property.name === 'updateTemplateNameNotice',
	);
	assert.deepEqual(templateName.displayOptions.show.operation, ['create']);
	assert.ok(updateTemplateNameNotice);
	assert.deepEqual(updateTemplateNameNotice.displayOptions.show.operation, ['update']);
});

test('credential defaults to the official production API', () => {
	const credential = new HubMessageApi();
	const baseUrl = credential.properties.find((property) => property.name === 'baseUrl');

	assert.equal(baseUrl.default, 'https://api.hubmessage.io');
	assert.equal(credential.test.request.baseURL, '={{$credentials.baseUrl}}');
});

test('message fields provide visual editors and advanced input modes', () => {
	const properties = new HubMessage().description.properties;
	const actionButtonsMode = properties.find(
		(property) => property.name === 'actionButtonsInputMode',
	);
	const actionButtonsUi = properties.find((property) => property.name === 'actionButtonsUi');
	const replyButtonsMode = properties.find(
		(property) => property.name === 'replyButtonsInputMode',
	);
	const replyButtonsUi = properties.find((property) => property.name === 'replyButtonsUi');
	const contactPhonesUi = properties.find((property) => property.name === 'contactPhonesUi');
	const interactiveButtonOptions = properties.find(
		(property) => property.name === 'interactiveButtonOptions',
	);
	const thumbnailMimeType = interactiveButtonOptions.options.find(
		(property) => property.name === 'thumbnailMimeType',
	);

	assert.equal(actionButtonsMode.default, 'fields');
	assert.equal(actionButtonsMode.noDataExpression, true);
	assert.deepEqual(
		actionButtonsMode.options.map((option) => option.value),
		['fields', 'json'],
	);
	assert.equal(actionButtonsUi.type, 'fixedCollection');
	assert.equal(actionButtonsUi.typeOptions.multipleValues, true);
	assert.equal(actionButtonsUi.typeOptions.sortable, true);
	assert.equal(actionButtonsUi.typeOptions.minRequiredFields, 1);

	const actionButtonFields = actionButtonsUi.options[0].values;
	const actionType = actionButtonFields.find((property) => property.name === 'actionType');
	assert.equal(actionType.type, 'options');
	assert.deepEqual(
		actionType.options.map((option) => option.value),
		['CALL', 'URL'],
	);
	assert.equal(
		actionButtonFields.find((property) => property.name === 'phones').type,
		'string',
	);

	assert.equal(replyButtonsMode.default, 'fields');
	assert.equal(replyButtonsMode.noDataExpression, true);
	assert.deepEqual(
		replyButtonsMode.options.map((option) => option.value),
		['fields', 'json'],
	);
	assert.equal(replyButtonsUi.type, 'fixedCollection');
	assert.equal(replyButtonsUi.typeOptions.multipleValues, true);
	assert.equal(replyButtonsUi.typeOptions.sortable, true);
	assert.equal(replyButtonsUi.typeOptions.minRequiredFields, 1);
	assert.equal(replyButtonsUi.typeOptions.maxAllowedFields, 3);
	assert.deepEqual(replyButtonsUi.default, {});
	assert.deepEqual(actionButtonsUi.default, {});

	assert.equal(contactPhonesUi.type, 'fixedCollection');
	assert.equal(contactPhonesUi.typeOptions.multipleValues, true);
	assert.equal(contactPhonesUi.typeOptions.minRequiredFields, 1);
	assert.deepEqual(contactPhonesUi.default, {});
	assert.equal(thumbnailMimeType.type, 'options');
	assert.deepEqual(
		thumbnailMimeType.options.map((option) => option.value),
		['custom', 'image/jpeg', 'video/mp4'],
	);

	const messageTemplateName = properties.find(
		(property) => property.name === 'messageTemplateName',
	);
	const messageTemplateComponents = properties.find(
		(property) => property.name === 'messageTemplateComponents',
	);
	const messageTemplateComponentsMode = properties.find(
		(property) => property.name === 'messageTemplateComponentsInputModeRemoved',
	);
	const managedTemplateComponentsMode = properties.find(
		(property) => property.name === 'templateComponentsInputModeRemoved',
	);
	const messageTemplateLanguage = properties.find(
		(property) => property.name === 'languageCode',
	);
	const managedTemplateLanguage = properties.find(
		(property) => property.name === 'templateLanguage',
	);
	assert.deepEqual(messageTemplateName.displayOptions.show.resource, ['message']);
	assert.equal(messageTemplateName.type, 'options');
	assert.equal(messageTemplateName.typeOptions.loadOptionsMethod, 'getMessageTemplates');
	assert.deepEqual(messageTemplateComponents.displayOptions.show.resource, ['message']);
	assert.equal(messageTemplateComponents.type, 'json');
	assert.equal(messageTemplateComponents.required, true);
	assert.equal(messageTemplateComponentsMode.type, 'hidden');
	assert.equal(messageTemplateComponentsMode.default, 'removed');
	assert.equal(managedTemplateComponentsMode.type, 'hidden');
	assert.equal(managedTemplateComponentsMode.default, 'removed');
	assert.equal(properties.filter((property) => property.name === 'templateName').length, 1);
	assert.equal(properties.filter((property) => property.name === 'templateComponents').length, 1);
	for (const languageField of [messageTemplateLanguage, managedTemplateLanguage]) {
		assert.equal(languageField.type, 'options');
		assert.equal(languageField.default, 'pt_BR');
		assert.ok(languageField.options.length > 100);
		assert.ok(
			languageField.options.some(
				(option) => option.name === 'Portuguese (Brazil)' && option.value === 'pt_BR',
			),
		);
		assert.ok(
			languageField.options.some(
				(option) => option.name === 'English (US)' && option.value === 'en_US',
			),
		);
	}
	assert.deepEqual(messageTemplateLanguage.options, managedTemplateLanguage.options);
});

test('visual message fields pass n8n parameter validation', () => {
	const description = new HubMessage().description;
	const samples = [
		{
			resource: 'message',
			operation: 'sendInteractiveAction',
			channelId: 'channel-id',
			recipient: '5511999999999',
			interactiveMessage: 'Choose',
			interactiveActionOptions: {},
			actionButtonsInputMode: 'fields',
			actionButtonsUi: {
				buttonValues: [
					{ id: 'call', title: 'Call', actionType: 'CALL', phones: '5511999999999' },
				],
			},
		},
		{
			resource: 'message',
			operation: 'sendInteractiveAction',
			channelId: 'channel-id',
			recipient: '5511999999999',
			interactiveMessage: 'Choose',
			interactiveActionOptions: {},
			actionButtonsInputMode: 'fields',
			actionButtonsUi: {
				buttonValues: [
					{
						id: 'url',
						title: 'Website',
						actionType: 'URL',
						url: 'https://example.com',
					},
				],
			},
		},
		{
			resource: 'message',
			operation: 'sendInteractiveButton',
			channelId: 'channel-id',
			recipient: '5511999999999',
			interactiveMessage: 'Choose',
			replyButtonsInputMode: 'fields',
			replyButtonsUi: { buttonValues: [{ id: 'yes', title: 'Yes' }] },
			interactiveButtonOptions: {},
		},
		{
			resource: 'message',
			operation: 'sendContact',
			channelId: 'channel-id',
			recipient: '5511999999999',
			contactName: 'Ada',
			contactPhonesInputMode: 'fields',
			contactPhonesUi: { phoneValues: [{ phone: '5511888888888' }] },
		},
	];

	for (const parameters of samples) {
		const issues = NodeHelpers.getNodeParametersIssues(
			description.properties,
			{
				id: 'hubmessage-test-node',
				name: 'HubMessage',
				type: 'n8n-nodes-hubmessage.hubMessage',
				typeVersion: 1,
				position: [0, 0],
				parameters,
			},
			description,
		);
		assert.equal(issues, null);
	}
});

test('legacy button and phone parameters fail instead of sending visual defaults', async () => {
	const cases = [
		{
			operation: 'sendInteractiveAction',
			parameters: {
				interactiveMessage: 'Choose',
				actionButtons: JSON.stringify([
					{
						id: 'legacy',
						title: 'Legacy',
						name: 'URL',
						url: 'https://example.com',
					},
				]),
			},
			error: /At least one action button is required/,
		},
		{
			operation: 'sendInteractiveButton',
			parameters: {
				interactiveMessage: 'Choose',
				replyButtons: JSON.stringify([{ id: 'legacy', title: 'Legacy' }]),
			},
			error: /Reply Buttons must contain between one and three buttons/,
		},
		{
			operation: 'sendContact',
			parameters: {
				contactName: 'Legacy contact',
				contactPhones: '5511999999999',
			},
			error: /At least one contact phone number is required/,
		},
	];

	for (const testCase of cases) {
		let requestCount = 0;
		const context = createContext(
			{
				resource: 'message',
				operation: testCase.operation,
				channelId: 'channel-id',
				recipient: '5511999999999',
				...testCase.parameters,
			},
			async function requestHandler() {
				requestCount += 1;
				return {};
			},
		);

		await assert.rejects(
			() => executeMessage.call(context, 0, testCase.operation),
			testCase.error,
		);
		assert.equal(requestCount, 0);
	}
});

test('Template Get Many WABAs calls the documented endpoint', async () => {
	let capturedOptions;
	const businesses = [
		{
			businessId: 'business-1',
			name: 'Demo',
			channelsCount: 1,
			connectedCount: 1,
			disconnectedCount: 0,
		},
	];
	const context = createContext({ resource: 'template', operation: 'getManyBusinesses' }, async function requestHandler(_credentialName, options) {
		capturedOptions = options;
		return businesses;
	});

	const result = await executeTemplate.call(context, 0, 'getManyBusinesses');

	assert.equal(capturedOptions.method, 'GET');
	assert.equal(capturedOptions.url, 'https://api.hubmessage.io/whatsapp/businesses');
	assert.equal(capturedOptions.headers['Content-Type'], undefined);
	assert.deepEqual(result, businesses);
});

test('Template Get Many WABAs preserves the current item index in response errors', async () => {
	const context = createContext(
		{ resource: 'template', operation: 'getManyBusinesses' },
		async function requestHandler() {
			return { unexpected: [] };
		},
	);

	await assert.rejects(
		() => executeTemplate.call(context, 2, 'getManyBusinesses'),
		(error) =>
			error?.constructor?.name === 'NodeOperationError' && error.context?.itemIndex === 2,
	);
});

test('Template Get Many extracts data from the documented response envelope', async () => {
	let capturedOptions;
	const templates = [
		{
			id: 'template-1',
			name: 'order_update_v1',
			status: 'APPROVED',
			category: 'UTILITY',
			language: 'pt_BR',
		},
	];
	const context = createContext(
		{ resource: 'template', operation: 'getMany', wabaId: 'waba/with spaces' },
		async function requestHandler(_credentialName, options) {
			capturedOptions = options;
			return { data: templates };
		},
	);

	const result = await executeTemplate.call(context, 0, 'getMany');

	assert.equal(capturedOptions.method, 'GET');
	assert.equal(
		capturedOptions.url,
		'https://api.hubmessage.io/whatsapp/businesses/waba%2Fwith%20spaces/templates',
	);
	assert.deepEqual(result, templates);
});

test('Template Create and Update use the documented payload and preserve the selected name', async () => {
	const requests = [];
	const components = [
		{
			type: 'BODY',
			text: 'Hello {{1}}',
			example: { body_text: [['Ana']] },
		},
	];
	const createParameters = {
		resource: 'template',
		operation: 'create',
		wabaId: 'waba-1',
		templateName: 'order_update_v1',
		templateCategory: 'UTILITY',
		templateLanguage: 'pt_BR',
		templateComponents: JSON.stringify(components),
	};
	const updateParameters = {
		resource: 'template',
		operation: 'update',
		wabaId: 'waba-1',
		templateId: 'template/1',
		templateName: 'attempted_rename_is_discarded',
		templateCategory: 'UTILITY',
		templateLanguage: 'pt_BR',
		templateComponents: JSON.stringify(components),
	};
	const requestHandler = async function requestHandler(_credentialName, options) {
		requests.push(options);
		if (options.method === 'POST') {
			return { id: 'created-template', status: 'PENDING', category: 'UTILITY' };
		}
		if (options.method === 'GET') {
			return {
				data: [{ id: 'template/1', name: 'order_update_v1', language: 'pt_BR' }],
			};
		}
		return { success: true };
	};
	const createContextInstance = createContext(createParameters, requestHandler);
	const updateContextInstance = createContext(updateParameters, requestHandler);

	await executeTemplate.call(createContextInstance, 0, 'create');
	await executeTemplate.call(updateContextInstance, 0, 'update');

	const expectedBody = {
		name: 'order_update_v1',
		category: 'UTILITY',
		language: 'pt_BR',
		components: [
			{
				type: 'BODY',
				text: 'Hello {{1}}',
				example: { body_text: [['Ana']] },
			},
		],
	};
	assert.equal(requests[0].method, 'POST');
	assert.equal(requests[0].headers['Content-Type'], 'application/json');
	assert.equal(
		requests[0].url,
		'https://api.hubmessage.io/whatsapp/businesses/waba-1/templates',
	);
	assert.deepEqual(requests[0].body, expectedBody);
	assert.equal(requests[1].method, 'GET');
	assert.equal(
		requests[1].url,
		'https://api.hubmessage.io/whatsapp/businesses/waba-1/templates',
	);
	assert.equal(requests[2].method, 'PUT');
	assert.equal(
		requests[2].url,
		'https://api.hubmessage.io/whatsapp/businesses/waba-1/templates/template%2F1',
	);
	assert.deepEqual(requests[2].body, expectedBody);
});

test('Template Create ignores removed visual fields and sends Components JSON', async () => {
	let capturedOptions;
	const components = [
		{
			type: 'BODY',
			text: 'Hello {{1}}, your order is ready.',
			example: { body_text: [['Ana']] },
		},
	];
	const context = createContext(
		{
			resource: 'template',
			operation: 'create',
			wabaId: 'waba-1',
			templateName: 'json_order_update',
			templateCategory: 'UTILITY',
			templateLanguage: 'pt_BR',
			templateComponentsInputMode: 'fields',
			templateBodyText: 'This removed visual field must not be sent.',
			templateComponents: JSON.stringify(components),
		},
		async function requestHandler(_credentialName, options) {
			capturedOptions = options;
			return { id: 'template-visual', status: 'PENDING' };
		},
	);

	await executeTemplate.call(context, 0, 'create');

	assert.deepEqual(capturedOptions.body, {
		name: 'json_order_update',
		category: 'UTILITY',
		language: 'pt_BR',
		components,
	});
});

test('Template Components rejects invalid JSON before HTTP', async () => {
	let requestCount = 0;
	const context = createContext(
		{
			resource: 'template',
			operation: 'create',
			wabaId: 'waba-1',
			templateName: 'invalid_examples',
			templateCategory: 'UTILITY',
			templateLanguage: 'pt_BR',
			templateComponents: '{invalid JSON',
		},
		async function requestHandler() {
			requestCount += 1;
			return {};
		},
	);

	await assert.rejects(
		() => executeTemplate.call(context, 0, 'create'),
		/Components must be valid JSON/,
	);
	assert.equal(requestCount, 0);
});

test('Template Update fails before PUT when the selected template cannot be resolved', async () => {
	const requests = [];
	const context = createContext(
		{
			resource: 'template',
			operation: 'update',
			wabaId: 'waba-1',
			templateId: 'missing-template',
			templateCategory: 'UTILITY',
			templateLanguage: 'pt_BR',
			templateComponents: JSON.stringify([{ type: 'BODY', text: 'Hello' }]),
		},
		async function requestHandler(_credentialName, options) {
			requests.push(options);
			return { data: [] };
		},
	);

	await assert.rejects(
		() => executeTemplate.call(context, 0, 'update'),
		/Template ID "missing-template" was not found in the selected WABA/,
	);
	assert.equal(requests.length, 1);
	assert.equal(requests[0].method, 'GET');
});

test('Template Delete and Sync use their documented endpoints', async () => {
	const requests = [];
	const context = createContext(
			{ resource: 'template', operation: 'delete', wabaId: 'waba-1', templateId: 'template-1' },
		async function requestHandler(_credentialName, options) {
			requests.push(options);
			return { success: true };
		},
	);

	await executeTemplate.call(context, 0, 'delete');
	await executeTemplate.call(context, 0, 'sync');

	assert.equal(requests[0].method, 'DELETE');
	assert.equal(requests[0].headers['Content-Type'], undefined);
	assert.equal(
		requests[0].url,
		'https://api.hubmessage.io/whatsapp/businesses/waba-1/templates/template-1',
	);
	assert.equal(requests[0].body, undefined);
	assert.equal(requests[1].method, 'POST');
	assert.equal(
		requests[1].url,
		'https://api.hubmessage.io/whatsapp/businesses/waba-1/templates/sync',
	);
});

test('Template dropdowns load and sort WABAs and templates', async () => {
	const requestedUrls = [];
	const context = createContext(
		{ resource: 'template', operation: 'getMany', wabaId: 'waba-1' },
		async function requestHandler(_credentialName, options) {
			requestedUrls.push(options.url);
			if (options.url.endsWith('/whatsapp/businesses')) {
				return [
					{ businessId: 'waba-2', name: 'Support', channelsCount: 1, connectedCount: 0 },
					{ businessId: 'waba-1', name: 'Sales', channelsCount: 2, connectedCount: 1 },
				];
			}

			return {
				data: [
					{
						id: 'template-2',
						name: 'welcome',
						language: 'pt_BR',
						category: 'MARKETING',
						status: 'PENDING',
					},
					{
						id: 'template-1',
						name: 'order_update',
						language: 'en_US',
						category: 'UTILITY',
						status: 'APPROVED',
					},
				],
			};
		},
	);

	const businessOptions = await loadBusinessOptions.call(context);
	const templateOptions = await loadTemplateOptions.call(context);

	assert.deepEqual(
		businessOptions.map(({ name, value }) => ({ name, value })),
		[
			{ name: 'Sales', value: 'waba-1' },
			{ name: 'Support', value: 'waba-2' },
		],
	);
	assert.deepEqual(
		templateOptions.map(({ name, value }) => ({ name, value })),
		[
			{ name: 'order_update (en_US)', value: 'template-1' },
			{ name: 'welcome (pt_BR)', value: 'template-2' },
		],
	);
	assert.match(templateOptions[0].description, /APPROVED/);
	assert.deepEqual(requestedUrls, [
		'https://api.hubmessage.io/whatsapp/businesses',
		'https://api.hubmessage.io/whatsapp/businesses/waba-1/templates',
	]);
});

test('Template dropdown does not request templates for an unresolved WABA expression', async () => {
	let requestCount = 0;
	const context = createContext(
		{
			resource: 'template',
			operation: 'getMany',
			wabaId: '={{ $json.wabaId }}',
		},
		async function requestHandler() {
			requestCount += 1;
			return [];
		},
	);

	assert.deepEqual(await loadTemplateOptions.call(context), []);
	assert.equal(requestCount, 0);
});

test('Send Template dropdown loads template names from every WABA and disables unapproved ones', async () => {
	const requestedUrls = [];
	const context = createContext(
		{ resource: 'message', operation: 'sendTemplate' },
		async function requestHandler(_credentialName, options) {
			requestedUrls.push(options.url);
			if (options.url.endsWith('/whatsapp/businesses')) {
				return [
					{ businessId: 'waba-1', name: 'Sales' },
					{ businessId: 'waba-2', name: 'Support' },
				];
			}
			if (options.url.includes('/waba-1/')) {
				return {
					data: [
						{
							id: 'template-1',
							name: 'order_update',
							language: 'en_US',
							category: 'UTILITY',
							status: 'APPROVED',
						},
						{
							id: 'template-2',
							name: 'welcome',
							language: 'pt_BR',
							category: 'MARKETING',
							status: 'PENDING',
						},
					],
				};
			}
			return {
				data: [
					{
						id: 'template-3',
						name: 'support_alert',
						language: 'pt_BR',
						category: 'UTILITY',
						status: 'APPROVED',
					},
				],
			};
		},
	);

	const options = await loadMessageTemplateOptions.call(context);

	assert.deepEqual(
		options.map(({ name, value, disabled }) => ({ name, value, disabled })),
		[
			{
				name: 'order_update (en_US) — APPROVED',
				value: 'order_update',
				disabled: false,
			},
			{
				name: 'support_alert (pt_BR) — APPROVED',
				value: 'support_alert',
				disabled: false,
			},
			{
				name: 'welcome (pt_BR) — PENDING',
				value: 'welcome',
				disabled: true,
			},
		],
	);
	assert.match(options[0].description, /Sales.*WABA waba-1.*template-1.*UTILITY/);
	assert.deepEqual(new Set(requestedUrls), new Set([
		'https://api.hubmessage.io/whatsapp/businesses',
		'https://api.hubmessage.io/whatsapp/businesses/waba-1/templates',
		'https://api.hubmessage.io/whatsapp/businesses/waba-2/templates',
	]));
});

test('Template extraction supports direct arrays and documented envelopes', () => {
	assert.deepEqual(extractBusinesses([{ businessId: 'waba-1' }]), [
		{ businessId: 'waba-1' },
	]);
	assert.deepEqual(extractBusinesses({ data: [{ businessId: 'waba-2' }] }), [
		{ businessId: 'waba-2' },
	]);
	assert.deepEqual(extractTemplates([{ id: 'template-1' }]), [{ id: 'template-1' }]);
	assert.deepEqual(extractTemplates({ data: [{ id: 'template-2' }] }), [
		{ id: 'template-2' },
	]);
});

test('Template extraction rejects unknown or malformed envelopes', () => {
	assert.throws(
		() => extractBusinesses({ businesses: { id: 'waba-1' } }),
		/Businesses response field "businesses" must be an array/,
	);
	assert.throws(
		() => extractTemplates({ unexpected: [] }),
		/Templates response does not contain a recognized array field/,
	);
});

test('Channel Connect calls the documented endpoint and payload', async () => {
	let capturedOptions;
	const context = createContext(
			{
				resource: 'channel',
				operation: 'connect',
				channelId: 'channel/with spaces',
			wabaId: '428083093730937',
			phoneId: '123456789012345',
			code: 'ABC123DEF456',
			coexistence: false,
		},
		async function requestHandler(_credentialName, options) {
			capturedOptions = options;
			return { success: true };
		},
	);

	const result = await executeChannel.call(context, 0, 'connect');

	assert.equal(capturedOptions.method, 'POST');
	assert.equal(
		capturedOptions.url,
		'https://api.hubmessage.io/v1/channels/channel%2Fwith%20spaces/connect',
	);
	assert.deepEqual(capturedOptions.body, {
		wabaId: '428083093730937',
		phoneId: '123456789012345',
		code: 'ABC123DEF456',
		coexistence: false,
	});
	assert.deepEqual(result, [{ success: true }]);
});

test('Channel Create calls the documented endpoint and payload', async () => {
	let capturedOptions;
	const context = createContext(
			{
				resource: 'channel',
				operation: 'create',
				name: 'Sales WhatsApp',
			channelType: 'META_WHATSAPP',
		},
		async function requestHandler(_credentialName, options) {
			capturedOptions = options;
			return { id: 'channel-created' };
		},
	);

	const result = await executeChannel.call(context, 0, 'create');

	assert.equal(capturedOptions.method, 'POST');
	assert.equal(capturedOptions.url, 'https://api.hubmessage.io/v1/channels');
	assert.deepEqual(capturedOptions.body, {
		name: 'Sales WhatsApp',
		type: 'META_WHATSAPP',
	});
	assert.deepEqual(result, [{ id: 'channel-created' }]);
});

test('Send Text calls the documented endpoint with the documented payload', async () => {
	let capturedCredentialName;
	let capturedOptions;
	const context = createContext(
			{
				resource: 'message',
				operation: 'sendText',
				channelId: 'channel/with spaces',
			recipient: '5511999999999',
			message: 'Hello from n8n',
		},
		async function requestHandler(credentialName, options) {
			capturedCredentialName = credentialName;
			capturedOptions = options;
			return { messageId: 'wamid.test' };
		},
	);

	const result = await executeMessage.call(context, 0, 'sendText');

	assert.equal(capturedCredentialName, 'hubMessageApi');
	assert.equal(capturedOptions.method, 'POST');
	assert.equal(
		capturedOptions.url,
		'https://api.hubmessage.io/v1/channels/channel%2Fwith%20spaces/messages',
	);
	assert.deepEqual(capturedOptions.body, {
		recipient: {
			identifier: '5511999999999',
		},
		content: {
			type: 'TEXT',
			body: {
				message: 'Hello from n8n',
			},
		},
	});
	assert.deepEqual(result, { messageId: 'wamid.test' });
});

test('node execute preserves paired items and continues after a per-item validation error', async () => {
	const requestedRecipients = [];
	const context = createExecuteContext(
		{
			resource: 'message',
			operation: 'sendText',
			channelId: 'channel-id',
			recipient: '5511999999999',
			message: 'Hello',
		},
		['5511999999999', '1234567890123456', '5511888888888'],
		async function requestHandler(_credentialName, options) {
			requestedRecipients.push(options.body.recipient.identifier);
			return { messageId: `message-${options.body.recipient.identifier}` };
		},
		true,
	);

	const [results] = await new HubMessage().execute.call(context);

	assert.deepEqual(requestedRecipients, ['5511999999999', '5511888888888']);
	assert.deepEqual(
		results.map((item) => item.pairedItem),
		[{ item: 0 }, { item: 1 }, { item: 2 }],
	);
	assert.match(results[1].json.error, /Recipient must contain only digits.*at most 15 digits/);
});

test('node execute stops on the first invalid item when continue on fail is disabled', async () => {
	let requestCount = 0;
	const context = createExecuteContext(
		{
			resource: 'message',
			operation: 'sendText',
			channelId: 'channel-id',
			recipient: '5511999999999',
			message: 'Hello',
		},
		['55ABC', '5511888888888'],
		async function requestHandler() {
			requestCount += 1;
			return {};
		},
		false,
	);

	await assert.rejects(
		() => new HubMessage().execute.call(context),
		(error) => error?.constructor?.name === 'NodeOperationError' && error.context?.itemIndex === 0,
	);
	assert.equal(requestCount, 0);
});

test('test context resolves every node parameter against its item index', async () => {
	let capturedOptions;
	const context = createContext(
		[
			{
				resource: 'message',
				operation: 'sendText',
				channelId: 'channel-one',
				recipient: '5511111111111',
				message: 'First',
			},
			{
				resource: 'message',
				operation: 'sendText',
				channelId: 'channel-two',
				recipient: '5522222222222',
				message: 'Second',
			},
		],
		async function requestHandler(_credentialName, options) {
			capturedOptions = options;
			return { messageId: 'second-message' };
		},
	);

	await executeMessage.call(context, 1, 'sendText');
	assert.equal(capturedOptions.url, 'https://api.hubmessage.io/v1/channels/channel-two/messages');
	assert.equal(capturedOptions.body.recipient.identifier, '5522222222222');
	assert.equal(capturedOptions.body.content.body.message, 'Second');
});

test('Media message operations use the documented attachment payloads', async () => {
	const cases = [
		{ operation: 'sendAudio', type: 'AUDIO', caption: undefined },
		{ operation: 'sendImage', type: 'IMAGE', caption: 'Image caption' },
		{ operation: 'sendSticker', type: 'STICKER', caption: undefined },
		{ operation: 'sendVideo', type: 'VIDEO', caption: 'Video caption' },
	];

	for (const testCase of cases) {
		let capturedOptions;
		const context = createContext(
				{
					resource: 'message',
					operation: testCase.operation,
					channelId: 'channel-id',
					recipient: '5511999999999',
					mediaUrl: 'https://example.com/media-file',
					mediaOptions:
						testCase.caption === undefined ? {} : { caption: testCase.caption },
			},
			async function requestHandler(_credentialName, options) {
				capturedOptions = options;
				return { messageId: `message-${testCase.type}` };
			},
		);

		await executeMessage.call(context, 0, testCase.operation);

		const expectedAttachment = { url: 'https://example.com/media-file' };
		if (testCase.caption !== undefined) expectedAttachment.caption = testCase.caption;
		assert.deepEqual(capturedOptions.body.content, {
			type: testCase.type,
			attachments: [expectedAttachment],
		});
	}
});

test('legacy optional message fields survive n8n normalization and remain in payloads', async () => {
	const requests = [];
	const requestHandler = async (_credentialName, options) => {
		requests.push(options);
		return { messageId: `message-${requests.length}` };
	};

	const legacyImage = createContext(
		{
			resource: 'message',
			operation: 'sendImage',
			channelId: 'channel-id',
			recipient: '5511999999999',
			mediaUrl: 'https://example.com/image.jpg',
			caption: 'Legacy caption',
		},
		requestHandler,
	);
	await executeMessage.call(legacyImage, 0, 'sendImage');

	const legacyAction = createContext(
		{
			resource: 'message',
			operation: 'sendInteractiveAction',
			channelId: 'channel-id',
			recipient: '5511999999999',
			interactiveMessage: 'Choose',
			interactiveHeader: 'Legacy header',
			interactiveFooter: 'Legacy footer',
			actionButtonsInputMode: 'json',
			actionButtons: [{ id: 'site', title: 'Site', name: 'URL', url: 'https://example.com' }],
		},
		requestHandler,
	);
	await executeMessage.call(legacyAction, 0, 'sendInteractiveAction');

	const legacyButton = createContext(
		{
			resource: 'message',
			operation: 'sendInteractiveButton',
			channelId: 'channel-id',
			recipient: '5511999999999',
			interactiveMessage: 'Choose',
			replyButtonsInputMode: 'json',
			replyButtons: [{ id: 'yes', title: 'Yes' }],
			thumbnailUrl: 'https://example.com/video.mp4',
			thumbnailMimeType: 'video/mp4',
		},
		requestHandler,
	);
	await executeMessage.call(legacyButton, 0, 'sendInteractiveButton');

	assert.deepEqual(requests[0].body.content.attachments, [
		{ url: 'https://example.com/image.jpg', caption: 'Legacy caption' },
	]);
	assert.deepEqual(requests[1].body.content.header, { message: 'Legacy header' });
	assert.deepEqual(requests[1].body.content.footer, { message: 'Legacy footer' });
	assert.equal(requests[2].body.content.body.thumbnail, 'https://example.com/video.mp4');
	assert.equal(requests[2].body.content.body.mimeType, 'video/mp4');
});

test('grouped optional message fields override legacy compatibility values, including empty values', async () => {
	let capturedOptions;
	const context = createContext(
		{
			resource: 'message',
			operation: 'sendImage',
			channelId: 'channel-id',
			recipient: '5511999999999',
			mediaUrl: 'https://example.com/image.jpg',
			caption: 'Legacy caption',
			mediaOptions: { caption: '' },
		},
		async function requestHandler(_credentialName, options) {
			capturedOptions = options;
			return { messageId: 'message-image' };
		},
	);

	await executeMessage.call(context, 0, 'sendImage');
	assert.deepEqual(capturedOptions.body.content.attachments, [
		{ url: 'https://example.com/image.jpg' },
	]);
});

test('Send Contact maps multiple phone numbers to one contact attachment', async () => {
	let capturedOptions;
	const context = createContext(
			{
				resource: 'message',
				operation: 'sendContact',
				channelId: 'channel-id',
				recipient: '5511999999999',
				contactName: 'Ada Lovelace',
				contactPhonesInputMode: 'list',
				contactPhones: '5511888888888,\n5511777777777',
		},
		async function requestHandler(_credentialName, options) {
			capturedOptions = options;
			return { messageId: 'contact-message' };
		},
	);

	await executeMessage.call(context, 0, 'sendContact');

	assert.deepEqual(capturedOptions.body.content, {
		type: 'CONTACT',
		attachments: [
			{
				name: 'Ada Lovelace',
				phones: ['5511888888888', '5511777777777'],
			},
		],
	});
});

test('Send Contact maps visual phone number fields to one contact attachment', async () => {
	let capturedOptions;
	const context = createContext(
			{
				resource: 'message',
				operation: 'sendContact',
				channelId: 'channel-id',
			recipient: '5511999999999',
			contactName: 'Ada Lovelace',
			contactPhonesInputMode: 'fields',
			contactPhonesUi: {
				phoneValues: [{ phone: '5511888888888' }, { phone: '5511777777777' }],
			},
		},
		async function requestHandler(_credentialName, options) {
			capturedOptions = options;
			return { messageId: 'contact-message' };
		},
	);

	await executeMessage.call(context, 0, 'sendContact');

	assert.deepEqual(capturedOptions.body.content, {
		type: 'CONTACT',
		attachments: [
			{
				name: 'Ada Lovelace',
				phones: ['5511888888888', '5511777777777'],
			},
		],
	});
});

test('Send Template maps language and components to the documented payload', async () => {
	let capturedOptions;
	const components = [
		{
			type: 'body',
			parameters: [{ type: 'text', text: 'Ana' }],
		},
	];
	const context = createContext(
			{
				resource: 'message',
				operation: 'sendTemplate',
				channelId: 'channel-id',
				recipient: '5511999999999',
				messageTemplateName: 'order_update_v1',
				languageCode: 'pt_BR',
				messageTemplateComponents: JSON.stringify(components),
		},
		async function requestHandler(_credentialName, options) {
			capturedOptions = options;
			return { messageId: 'template-message' };
		},
	);

	await executeMessage.call(context, 0, 'sendTemplate');

	assert.deepEqual(capturedOptions.body.content, {
		type: 'TEMPLATE',
		attachments: [
			{
				template: {
					name: 'order_update_v1',
					language: { policy: 'deterministic', code: 'pt_BR' },
					components,
				},
			},
		],
	});
});

test('Send Template ignores removed visual fields and sends Components JSON', async () => {
	let capturedOptions;
	const components = [
		{
			type: 'body',
			parameters: [
				{ type: 'text', text: 'Ana' },
				{ type: 'text', text: '1234' },
			],
		},
	];
	const context = createContext(
		{
			resource: 'message',
			operation: 'sendTemplate',
			channelId: 'channel-id',
			recipient: '5511999999999',
			messageTemplateName: 'order_update_v1',
			languageCode: 'pt_BR',
			messageTemplateComponentsInputMode: 'fields',
			messageTemplateHeaderTextValue: 'This removed visual field must not be sent.',
			messageTemplateComponents: JSON.stringify(components),
		},
		async function requestHandler(_credentialName, options) {
			capturedOptions = options;
			return { messageId: 'visual-template-message' };
		},
	);

	await executeMessage.call(context, 0, 'sendTemplate');

	assert.deepEqual(capturedOptions.body.content.attachments[0].template.components, components);
});

test('Send Interactive Action maps URL and CALL buttons', async () => {
	let capturedOptions;
	const buttons = [
		{ id: '1', title: 'Website', name: 'URL', url: 'https://www.hubmessage.io' },
		{ id: '2', title: 'Call us', name: 'CALL', phones: ['5511999999999'] },
	];
	const context = createContext(
			{
				resource: 'message',
				operation: 'sendInteractiveAction',
				channelId: 'channel-id',
				recipient: '5511999999999',
				interactiveMessage: 'How can we help?',
				interactiveActionOptions: {
					header: 'HubMessage',
					footer: 'Choose an option',
				},
				actionButtonsInputMode: 'json',
				actionButtons: JSON.stringify(buttons),
		},
		async function requestHandler(_credentialName, options) {
			capturedOptions = options;
			return { messageId: 'interactive-action-message' };
		},
	);

	await executeMessage.call(context, 0, 'sendInteractiveAction');
	assert.deepEqual(capturedOptions.body.content, {
		type: 'INTERACTIVE_ACTION',
		body: { message: 'How can we help?' },
		header: { message: 'HubMessage' },
		footer: { message: 'Choose an option' },
		attachments: buttons,
	});
});

test('Send Interactive Action maps visual URL and CALL button fields', async () => {
	let capturedOptions;
	const buttons = [
		{ id: '1', title: 'Website', name: 'URL', url: 'https://www.hubmessage.io' },
		{ id: '2', title: 'Call us', name: 'CALL', phones: ['5511999999999'] },
	];
	const context = createContext(
			{
				resource: 'message',
				operation: 'sendInteractiveAction',
				channelId: 'channel-id',
				recipient: '5511999999999',
				interactiveMessage: 'How can we help?',
				interactiveActionOptions: {
					header: 'HubMessage',
					footer: 'Choose an option',
				},
			actionButtonsInputMode: 'fields',
			actionButtonsUi: {
				buttonValues: [
					{
						id: '1',
						title: 'Website',
						actionType: 'URL',
						url: 'https://www.hubmessage.io',
					},
					{
						id: '2',
						title: 'Call us',
						actionType: 'CALL',
						phones: '5511999999999',
					},
				],
			},
		},
		async function requestHandler(_credentialName, options) {
			capturedOptions = options;
			return { messageId: 'interactive-action-message' };
		},
	);

	await executeMessage.call(context, 0, 'sendInteractiveAction');
	assert.deepEqual(capturedOptions.body.content, {
		type: 'INTERACTIVE_ACTION',
		body: { message: 'How can we help?' },
		header: { message: 'HubMessage' },
		footer: { message: 'Choose an option' },
		attachments: buttons,
	});
});

test('JSON action buttons are normalized and unknown fields are not forwarded', async () => {
	let capturedOptions;
	const context = createContext(
		{
			resource: 'message',
			operation: 'sendInteractiveAction',
			channelId: 'channel-id',
			recipient: '5511999999999',
			interactiveMessage: 'Visit us',
			interactiveActionOptions: {},
			actionButtonsInputMode: 'json',
			actionButtons: [
				{
					id: 1,
					title: 'Website',
					name: 'URL',
					url: 'https://example.com',
					unexpected: 'not-forwarded',
				},
			],
		},
		async function requestHandler(_credentialName, options) {
			capturedOptions = options;
			return { messageId: 'interactive-action-message' };
		},
	);

	await executeMessage.call(context, 0, 'sendInteractiveAction');
	assert.deepEqual(capturedOptions.body.content.attachments, [
		{ id: '1', title: 'Website', name: 'URL', url: 'https://example.com' },
	]);
});

test('Send Interactive Button maps quick replies and optional thumbnail', async () => {
	let capturedOptions;
	const buttons = [
		{ id: '1', title: 'Yes' },
		{ id: '2', title: 'No' },
	];
	const context = createContext(
			{
				resource: 'message',
				operation: 'sendInteractiveButton',
				channelId: 'channel-id',
				recipient: '5511999999999',
				interactiveMessage: 'Are you interested?',
				replyButtonsInputMode: 'json',
				replyButtons: JSON.stringify(buttons),
				interactiveButtonOptions: {
					thumbnailUrl: 'https://example.com/image.jpg',
					thumbnailMimeType: 'image/jpeg',
				},
		},
		async function requestHandler(_credentialName, options) {
			capturedOptions = options;
			return { messageId: 'interactive-button-message' };
		},
	);

	await executeMessage.call(context, 0, 'sendInteractiveButton');
	assert.deepEqual(capturedOptions.body.content, {
		type: 'INTERACTIVE_BUTTON',
		body: {
			message: 'Are you interested?',
			thumbnail: 'https://example.com/image.jpg',
			mimeType: 'image/jpeg',
		},
		attachments: buttons,
	});
});

test('Send Interactive Button maps visual reply button fields', async () => {
	let capturedOptions;
	const buttons = [
		{ id: '1', title: 'Yes' },
		{ id: '2', title: 'No' },
	];
	const context = createContext(
			{
				resource: 'message',
				operation: 'sendInteractiveButton',
				channelId: 'channel-id',
			recipient: '5511999999999',
			interactiveMessage: 'Are you interested?',
			replyButtonsInputMode: 'fields',
			replyButtonsUi: { buttonValues: buttons },
				interactiveButtonOptions: {},
		},
		async function requestHandler(_credentialName, options) {
			capturedOptions = options;
			return { messageId: 'interactive-button-message' };
		},
	);

	await executeMessage.call(context, 0, 'sendInteractiveButton');
	assert.deepEqual(capturedOptions.body.content, {
		type: 'INTERACTIVE_BUTTON',
		body: { message: 'Are you interested?' },
		attachments: buttons,
	});
});

test('JSON reply buttons are normalized and unknown fields are not forwarded', async () => {
	let capturedOptions;
	const context = createContext(
		{
			resource: 'message',
			operation: 'sendInteractiveButton',
			channelId: 'channel-id',
			recipient: '5511999999999',
			interactiveMessage: 'Choose',
			replyButtonsInputMode: 'json',
			replyButtons: [{ id: 1, title: 'Yes', unexpected: 'not-forwarded' }],
			interactiveButtonOptions: {},
		},
		async function requestHandler(_credentialName, options) {
			capturedOptions = options;
			return { messageId: 'interactive-button-message' };
		},
	);

	await executeMessage.call(context, 0, 'sendInteractiveButton');
	assert.deepEqual(capturedOptions.body.content.attachments, [{ id: '1', title: 'Yes' }]);
});

test('Send Interactive Button supports a custom thumbnail MIME type', async () => {
	let capturedOptions;
	const context = createContext(
		{
			resource: 'message',
			operation: 'sendInteractiveButton',
			channelId: 'channel-id',
			recipient: '5511999999999',
			interactiveMessage: 'Choose',
			replyButtonsInputMode: 'fields',
			replyButtonsUi: { buttonValues: [{ id: 'yes', title: 'Yes' }] },
			interactiveButtonOptions: {
				thumbnailUrl: 'https://example.com/image.png',
				thumbnailMimeType: 'custom',
				thumbnailCustomMimeType: 'image/png',
			},
		},
		async function requestHandler(_credentialName, options) {
			capturedOptions = options;
			return { messageId: 'interactive-button-message' };
		},
	);

	await executeMessage.call(context, 0, 'sendInteractiveButton');
	assert.equal(capturedOptions.body.content.body.mimeType, 'image/png');
});

test('Send Interactive Button requires a MIME type when a grouped thumbnail URL is set', async () => {
	let requestCount = 0;
	const context = createContext(
		{
			resource: 'message',
			operation: 'sendInteractiveButton',
			channelId: 'channel-id',
			recipient: '5511999999999',
			interactiveMessage: 'Choose',
			replyButtonsInputMode: 'fields',
			replyButtonsUi: { buttonValues: [{ id: 'yes', title: 'Yes' }] },
			interactiveButtonOptions: {
				thumbnailUrl: 'https://example.com/video.mp4',
			},
		},
		async function requestHandler() {
			requestCount += 1;
			return {};
		},
	);

	await assert.rejects(
		() => executeMessage.call(context, 0, 'sendInteractiveButton'),
		/Thumbnail MIME Type is required when Thumbnail URL is set/,
	);
	assert.equal(requestCount, 0);
});

test('Send Interactive Button validates custom MIME type format', async () => {
	let requestCount = 0;
	const context = createContext(
		{
			resource: 'message',
			operation: 'sendInteractiveButton',
			channelId: 'channel-id',
			recipient: '5511999999999',
			interactiveMessage: 'Choose',
			replyButtonsInputMode: 'fields',
			replyButtonsUi: { buttonValues: [{ id: 'yes', title: 'Yes' }] },
			interactiveButtonOptions: {
				thumbnailUrl: 'https://example.com/image.png',
				thumbnailMimeType: 'custom',
				thumbnailCustomMimeType: 'png',
			},
		},
		async function requestHandler() {
			requestCount += 1;
			return {};
		},
	);

	await assert.rejects(
		() => executeMessage.call(context, 0, 'sendInteractiveButton'),
		/Thumbnail MIME Type must use the type\/subtype format/,
	);
	assert.equal(requestCount, 0);
});

test('Send Interactive Button rejects duplicate IDs before making the request', async () => {
	let requestCount = 0;
	const context = createContext(
			{
				resource: 'message',
				operation: 'sendInteractiveButton',
				channelId: 'channel-id',
			recipient: '5511999999999',
			interactiveMessage: 'Choose one',
			replyButtonsInputMode: 'fields',
			replyButtonsUi: {
				buttonValues: [
					{ id: 'same-id', title: 'Yes' },
					{ id: 'same-id', title: 'No' },
				],
			},
				interactiveButtonOptions: {},
		},
		async function requestHandler() {
			requestCount += 1;
			return {};
		},
	);

	await assert.rejects(
		() => executeMessage.call(context, 0, 'sendInteractiveButton'),
		/Reply Buttons must have unique IDs/,
	);
	assert.equal(requestCount, 0);
});

test('Send Interactive Button accepts three buttons and rejects zero or four', async () => {
	let requestCount = 0;
	const baseParameters = {
		resource: 'message',
		operation: 'sendInteractiveButton',
		channelId: 'channel-id',
		recipient: '5511999999999',
		interactiveMessage: 'Choose',
		replyButtonsInputMode: 'fields',
		interactiveButtonOptions: {},
	};
	const requestHandler = async () => {
		requestCount += 1;
		return { messageId: 'interactive-button-message' };
	};

	const threeButtons = createContext(
		{
			...baseParameters,
			replyButtonsUi: {
				buttonValues: [
					{ id: '1', title: 'One' },
					{ id: '2', title: 'Two' },
					{ id: '3', title: 'Three' },
				],
			},
		},
		requestHandler,
	);
	await executeMessage.call(threeButtons, 0, 'sendInteractiveButton');

	for (const buttonValues of [
		[],
		[
			{ id: '1', title: 'One' },
			{ id: '2', title: 'Two' },
			{ id: '3', title: 'Three' },
			{ id: '4', title: 'Four' },
		],
	]) {
		const context = createContext(
			{ ...baseParameters, replyButtonsUi: { buttonValues } },
			requestHandler,
		);
		await assert.rejects(
			() => executeMessage.call(context, 0, 'sendInteractiveButton'),
			/Reply Buttons must contain between one and three buttons/,
		);
	}

	assert.equal(requestCount, 1);
});

test('invalid interactive inputs are rejected before making the request', async () => {
	const cases = [
		{
			operation: 'sendInteractiveButton',
			parameters: {
				interactiveMessage: 'Choose',
				replyButtonsInputMode: 'json',
				replyButtons: '[invalid',
				interactiveButtonOptions: {},
			},
			error: /Reply Buttons must be valid JSON/,
		},
		{
			operation: 'sendInteractiveButton',
			parameters: {
				interactiveMessage: 'Choose',
				replyButtonsInputMode: 'json',
				replyButtons: JSON.stringify([
					{ id: 'same', title: 'One' },
					{ id: 'same', title: 'Two' },
				]),
				interactiveButtonOptions: {},
			},
			error: /Reply Buttons must have unique IDs/,
		},
		{
			operation: 'sendInteractiveAction',
			parameters: {
				interactiveMessage: 'Choose',
				interactiveActionOptions: {},
				actionButtonsInputMode: 'fields',
				actionButtonsUi: {
					buttonValues: [
						{ id: 'url', title: 'Unsafe', actionType: 'URL', url: 'javascript:alert(1)' },
					],
				},
			},
			error: /Action button URL must be a valid HTTP or HTTPS URL/,
		},
		{
			operation: 'sendInteractiveAction',
			parameters: {
				interactiveMessage: 'Choose',
				interactiveActionOptions: {},
				actionButtonsInputMode: 'fields',
				actionButtonsUi: {
					buttonValues: [{ id: 'call', title: 'Call', actionType: 'CALL', phones: '' }],
				},
			},
			error: /CALL action buttons require at least one phone number/,
		},
		{
			operation: 'sendInteractiveButton',
			parameters: {
				interactiveMessage: 'Choose',
				replyButtonsInputMode: 'fields',
				replyButtonsUi: { buttonValues: [{ id: 'yes', title: 'Yes' }] },
				interactiveButtonOptions: {
					thumbnailUrl: 'https://example.com/image',
					thumbnailMimeType: 'custom',
					thumbnailCustomMimeType: '',
				},
			},
			error: /Custom Thumbnail MIME Type is required/,
		},
	];

	for (const testCase of cases) {
		let requestCount = 0;
		const context = createContext(
			{
				resource: 'message',
				operation: testCase.operation,
				channelId: 'channel-id',
				recipient: '5511999999999',
				...testCase.parameters,
			},
			async function requestHandler() {
				requestCount += 1;
				return {};
			},
		);

		await assert.rejects(
			() => executeMessage.call(context, 0, testCase.operation),
			testCase.error,
		);
		assert.equal(requestCount, 0);
	}
});

test('Send Text validates the recipient before making the HTTP request', async () => {
	let requestCount = 0;
	const context = createContext(
			{
				resource: 'message',
				operation: 'sendText',
				channelId: 'channel-id',
				recipient: '1234567890123456',
			message: 'Hello',
		},
		async function requestHandler() {
			requestCount += 1;
			return {};
		},
	);

	await assert.rejects(
		() => executeMessage.call(context, 0, 'sendText'),
		/Recipient must contain only digits.*at most 15 digits/,
	);
	assert.equal(requestCount, 0);
});

test('Send Text removes common phone formatting before sending', async () => {
	let capturedOptions;
	const context = createContext(
		{
			resource: 'message',
			operation: 'sendText',
			channelId: 'channel-id',
			recipient: '+55 (11) 99999-9999',
			message: 'Hello',
		},
		async function requestHandler(_credentialName, options) {
			capturedOptions = options;
			return { messageId: 'formatted-phone-message' };
		},
	);

	await executeMessage.call(context, 0, 'sendText');
	assert.equal(capturedOptions.body.recipient.identifier, '5511999999999');
});

test('Send Text does not impose an undocumented minimum phone length', async () => {
	let capturedOptions;
	const context = createContext(
		{
			resource: 'message',
			operation: 'sendText',
			channelId: 'channel-id',
			recipient: '1234567',
			message: 'Hello',
		},
		async function requestHandler(_credentialName, options) {
			capturedOptions = options;
			return { messageId: 'short-international-number' };
		},
	);

	await executeMessage.call(context, 0, 'sendText');
	assert.equal(capturedOptions.body.recipient.identifier, '1234567');
});

test('HTTP failures are surfaced as NodeApiError', async () => {
	const context = createContext(
			{
				resource: 'message',
				operation: 'sendText',
				channelId: 'channel-id',
			recipient: '5511999999999',
			message: 'Hello',
		},
		async function requestHandler() {
			const error = new Error('Unauthorized');
			error.response = {
				status: 401,
				body: { error: 401, message: 'Unauthorized' },
			};
			throw error;
		},
	);

	await assert.rejects(
		() => executeMessage.call(context, 0, 'sendText'),
		(error) => error?.constructor?.name === 'NodeApiError',
	);
});
