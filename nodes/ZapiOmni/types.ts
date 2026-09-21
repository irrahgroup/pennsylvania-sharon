export type ZapiOmniResource = 'channel' | 'message' | 'template';

export type ZapiOmniChannelOperation = 'connect' | 'create';

export type ZapiOmniMessageOperation =
	| 'sendAudio'
	| 'sendContact'
	| 'sendImage'
	| 'sendInteractiveAction'
	| 'sendInteractiveButton'
	| 'sendSticker'
	| 'sendTemplate'
	| 'sendText'
	| 'sendVideo';

export type ZapiOmniTemplateOperation =
	| 'create'
	| 'delete'
	| 'getMany'
	| 'getManyBusinesses'
	| 'sync'
	| 'update';
