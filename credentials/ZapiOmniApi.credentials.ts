import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
	Icon,
} from 'n8n-workflow';

export class ZapiOmniApi implements ICredentialType {
	name = 'zapiOmniApi';

	displayName = 'Z-API Omni API';

	documentationUrl = 'https://developer.omni.z-api.io/authentication';

	icon: Icon = 'file:../icons/zapi-omni.svg';

	properties: INodeProperties[] = [
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://api.omni.z-api.io',
			required: true,
			description: 'Official Z-API Omni production API base URL',
		},
		{
			displayName: 'Secret Key',
			name: 'secretKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			description: 'Secret Key generated in the Z-API Omni Security panel',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.secretKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl}}',
			url: '/whatsapp/businesses',
			method: 'GET',
		},
	};

}
