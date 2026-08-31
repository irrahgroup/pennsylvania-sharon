const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const { NodeHelpers } = require('n8n-workflow');
const { HubMessage } = require('../dist/nodes/HubMessage/HubMessage.node.js');

const workflowPath = path.join(
	__dirname,
	'..',
	'workflows',
	'hubmessage-all-operations-test.json',
);

function assertNoParameterDrift(savedValue, normalizedValue, parameterPath) {
	if (Array.isArray(savedValue)) {
		assert.ok(Array.isArray(normalizedValue), `${parameterPath} was not preserved as an array`);
		assert.equal(
			normalizedValue.length,
			savedValue.length,
			`${parameterPath} lost one or more array items`,
		);
		savedValue.forEach((value, index) =>
			assertNoParameterDrift(value, normalizedValue[index], `${parameterPath}[${index}]`),
		);
		return;
	}

	if (savedValue !== null && typeof savedValue === 'object') {
		assert.ok(
			normalizedValue !== null && typeof normalizedValue === 'object',
			`${parameterPath} was not preserved as an object`,
		);
		for (const [key, value] of Object.entries(savedValue)) {
			assert.ok(
				Object.prototype.hasOwnProperty.call(normalizedValue, key),
				`${parameterPath}.${key} was discarded by the node description`,
			);
			assertNoParameterDrift(value, normalizedValue[key], `${parameterPath}.${key}`);
		}
		return;
	}

	assert.deepEqual(normalizedValue, savedValue, `${parameterPath} changed during normalization`);
}

test('all-operations workflow is valid, complete, and safe by default', () => {
	const workflow = JSON.parse(readFileSync(workflowPath, 'utf8'));
	const hubMessageNodes = workflow.nodes.filter(
		(node) => node.type === '@zapi-omni/n8n-nodes-hubmessage.hubMessage',
	);
	const operations = hubMessageNodes.map((node) => [
		node.parameters.resource,
		node.parameters.operation,
	]);

	assert.equal(workflow.active, false);
	assert.equal(hubMessageNodes.length, 17);
	assert.ok(hubMessageNodes.every((node) => node.disabled === true));
	assert.ok(hubMessageNodes.every((node) => node.credentials === undefined));

	const description = new HubMessage().description;
	for (const savedNode of hubMessageNodes) {
		const nodeForValidation = { ...savedNode, disabled: false };
		const normalizedParameters = NodeHelpers.getNodeParameters(
			description.properties,
			savedNode.parameters,
			true,
			false,
			nodeForValidation,
			description,
		);
		assert.ok(normalizedParameters, `${savedNode.name} could not be normalized`);
		assertNoParameterDrift(savedNode.parameters, normalizedParameters, savedNode.name);
		assert.equal(
			NodeHelpers.getNodeParametersIssues(
				description.properties,
				nodeForValidation,
				description,
			),
			null,
			`${savedNode.name} has parameter validation issues`,
		);
	}
	assert.deepEqual(
		operations.sort(),
		[
			['channel', 'connect'],
			['channel', 'create'],
			['message', 'sendAudio'],
			['message', 'sendContact'],
			['message', 'sendImage'],
			['message', 'sendInteractiveAction'],
			['message', 'sendInteractiveButton'],
			['message', 'sendSticker'],
			['message', 'sendTemplate'],
			['message', 'sendText'],
			['message', 'sendVideo'],
			['template', 'create'],
			['template', 'delete'],
			['template', 'getMany'],
			['template', 'getManyBusinesses'],
			['template', 'sync'],
			['template', 'update'],
		].sort(),
	);

	const configConnections = workflow.connections.Config.main[0];
	assert.equal(configConnections.length, hubMessageNodes.length);
	assert.deepEqual(
		new Set(configConnections.map((connection) => connection.node)),
		new Set(hubMessageNodes.map((node) => node.name)),
	);
});
