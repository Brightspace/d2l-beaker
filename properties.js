
const login = require('./login.js');

const getProperty = async(page, url, provider, config) => {
	if (page.url() !== url) {
		await page.goto(url, {waitUntil: ['networkidle2', 'load']});
		if (login.isLoginPage(page.url(), config.target.login)) {
			if (!await login.login(page, config.target.login)) {
				process.exit(1);
			}
			await page.goto(url, {waitUntil: ['networkidle2', 'load']});
		}
	}
	return await page.evaluate(provider);
};

const getProviders = (keys) => {
	const providers = [];
	if (keys) {
		for (let i = 0; i < keys.length; i++) {
			if (typeof keys[i] === 'object') {
				if (keys[i].hasOwnProperty('key') && keys[i].hasOwnProperty('provider')) {
					providers.push({key: keys[i].key, provider: keys[i].provider});
				}
			}
		}
	}
	return providers;
};

const getProperties = async(page, url, keys, config) => {
	const providers = getProviders(keys);
	const properties = [];
	if (providers && providers.length > 0) {
		process.stdout.write('Properties: ');
		for (let i = 0; i < providers.length; i++) {
			const property = {
				name: providers[i].key,
				value: await getProperty(page, url, providers[i].provider, config)
			};
			process.stdout.write(`${property.name}: ${property.value}; `);
			properties.push(property);
		}
		process.stdout.write('\n\n');
	}

	return properties;
};

module.exports = getProperties;
