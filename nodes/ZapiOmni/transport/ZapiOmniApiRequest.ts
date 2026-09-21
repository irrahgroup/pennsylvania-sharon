import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	ILoadOptionsFunctions,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError, NodeOperationError } from 'n8n-workflow';

const DEFAULT_BASE_URL = 'https://api.omni.z-api.io';
type ZapiOmniRequestContext = IExecuteFunctions | ILoadOptionsFunctions;

function normalizeBaseUrl(value: unknown): string {
	const baseUrl = String(value ?? DEFAULT_BASE_URL)
		.trim()
		.replace(/\/+$/u, '');

	if (!/^https?:\/\//iu.test(baseUrl)) {
		throw new Error('Base URL must start with http:// or https://');
	}

	return baseUrl;
}

export async function zapiOmniApiRequest<T = IDataObject>(
	this: ZapiOmniRequestContext,
	method: IHttpRequestMethods,
	endpoint: string,
	itemIndex: number,
	body?: IDataObject,
	query?: IDataObject,
): Promise<T> {
	const credentials = await this.getCredentials('zapiOmniApi');

	let baseUrl: string;
	try {
		baseUrl = normalizeBaseUrl(credentials.baseUrl);
	} catch (error: unknown) {
		throw new NodeOperationError(this.getNode(), error as Error, { itemIndex });
	}

	const options: IHttpRequestOptions = {
		method,
		url: `${baseUrl}${endpoint}`,
		headers: {
			Accept: 'application/json',
		},
		json: true,
	};

	if (body !== undefined && method !== 'GET' && method !== 'HEAD') {
		options.body = body;
		options.headers = {
			...options.headers,
			'Content-Type': 'application/json',
		};
	}

	if (query !== undefined && Object.keys(query).length > 0) {
		options.qs = query;
	}

	try {
		return (await this.helpers.httpRequestWithAuthentication.call(
			this,
			'zapiOmniApi',
			options,
		)) as T;
	} catch (error: unknown) {
		throw new NodeApiError(this.getNode(), error as JsonObject, { itemIndex });
	}
}
