import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
	Icon,
} from 'n8n-workflow';

export class HubMessageApi implements ICredentialType {
	name = 'hubMessageApi';

	displayName = 'HubMessage API';

	documentationUrl = 'https://developer.hubmessage.io/authentication';

	icon: Icon = {
		light: 'file:../icons/hubmessage.svg',
		dark: 'file:../icons/hubmessage.dark.svg',
	};

	properties: INodeProperties[] = [
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://api.hubmessage.io',
			required: true,
			description: 'Official HubMessage production API base URL',
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
			description: 'Secret Key generated in the HubMessage Security panel',
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
