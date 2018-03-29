const configHelper = {

	defaultConfig: {
		applicationKey: null,
		caching: true,
		headless: true,
		samplesPerTarget: 10,
		measurements: ['first-paint', 'first-contentful-paint'],
		properties: [],
		target: {
			site: null,
			login: {
				url: null,
				user: {selector: null, value: null},
				password: {selector: null, value: null},
				submit: {selector: null}
			},
			targets: []
		},
		upload: {
			key: 'S3',
			target: null,
			region: 'us-east-1',
			creds: {
				accessKeyId: null,
				secretAccessKey: null
			}
		}
	},

	getConfig: (argv, config) => {
		const resolved = {...configHelper.defaultConfig, ...config};
		if (argv.applicationKey) resolved.applicationKey = argv.applicationKey;
		if (argv.caching !== undefined) resolved.caching = argv.caching;
		if (argv.headless !== undefined) resolved.headless = argv.headless;
		if (argv.samplesPerTarget) resolved.samplesPerTarget = argv.samplesPerTarget;
		if (argv.targetSite) resolved.target.site = argv.targetSite;
		if (argv.user) resolved.target.login.user.value = argv.user;
		if (argv.pwd) resolved.target.login.password.value = argv.pwd;

		const resolveValues = (obj) => {
			for (const key in obj) {
				if (obj.hasOwnProperty(key)) {
					const typeOfValue = typeof obj[key];
					if (typeOfValue === 'string') {
						let resolvedValue = configHelper.resolveConfigValue(obj[key]);
						if (key === 'samplesPerTarget') resolvedValue = parseInt(resolvedValue);
						if (key === 'caching' && resolvedValue !== 'both') resolvedValue = (resolvedValue.toLowerCase() === 'true');
						if (key === 'headless') resolvedValue = (resolvedValue.toLowerCase() === 'true');
						obj[key] = resolvedValue;
					} else if (typeOfValue === 'object') {
						resolveValues(obj[key]);
					}
				}
			}
			return obj;
		};

		return resolveValues(resolved);
	},

	resolveConfigValue: (value) => {
		if (value.startsWith('{{') && value.endsWith('}}')) {
			const valueVar = value.substr(2, value.length - 4);
			return process.env[valueVar];
		}
		return value;
	}

};

module.exports = configHelper;
