export type HubMessageResource = 'channel' | 'message' | 'template';

export type HubMessageChannelOperation = 'connect' | 'create';

export type HubMessageMessageOperation =
	| 'sendAudio'
	| 'sendContact'
	| 'sendImage'
	| 'sendInteractiveAction'
	| 'sendInteractiveButton'
	| 'sendSticker'
	| 'sendTemplate'
	| 'sendText'
	| 'sendVideo';

export type HubMessageTemplateOperation =
	| 'create'
	| 'delete'
	| 'getMany'
	| 'getManyBusinesses'
	| 'sync'
	| 'update';
