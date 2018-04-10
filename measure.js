
const chalk = require('chalk');
const login = require('./login.js');
const helpers = require('./helpers.js');

const builtinProviders = {

	'tti': async() => {
		const tti = await ttiPolyfill.getFirstConsistentlyInteractive();
		return [{
			name: 'tti',
			entryType: 'measure',
			startTime: 0,
			duration: tti
		}];
	},

	'generic-pattern': async(pattern) => {

		pattern = pattern.substr(0, pattern.length - 1);

		const entries = window.performance.getEntries();

		const result = [];

		for (let i = 0; i < entries.length; i++) {
			if (entries[i].name.startsWith(pattern)) {
				result.push({
					name: entries[i].name,
					entryType: entries[i].entryType,
					startTime: entries[i].startTime,
					duration: entries[i].duration
				});
			}
		}

		return result;

	},

	'generic': async(key) => {

		if (!key) {
			return null;
		}

		const mapEntry = (entry) => {
			return {
				name: entry.name,
				entryType: entry.entryType,
				startTime: entry.startTime,
				duration: entry.duration
			};
		};

		const entries = window.performance.getEntriesByName(key);
		if (entries && entries.length > 0) {
			return entries.map(mapEntry);
		}

		const entryPromise = new Promise(function(resolve) {
			setTimeout(() => {
				//maybe reject instead
				resolve(null);
			}, 10000);
			const observer = new PerformanceObserver((list) => {
				const entries = list.getEntriesByName(key);
				if (entries && entries.length > 0) {
					resolve(entries.map(mapEntry));
				}
			});
			observer.observe({entryTypes: ['measure', 'mark', 'paint']});
		});

		return entryPromise;
	}

};

const getProviders = (keys) => {
	const providers = [];
	if (keys) {
		for (let i = 0; i < keys.length; i++) {
			if (builtinProviders[keys[i]]) {
				providers.push({key: keys[i], provider: builtinProviders[keys[i]]});
			} else if (keys[i].endsWith('*')) {
				providers.push({key: keys[i], provider: builtinProviders['generic-pattern']});
			} else {
				providers.push({key: keys[i], provider: builtinProviders['generic']});
			}
		}
	}
	return providers;
};

const getMeasurements = async(page, providers) => {

	let measurements = [];

	if (providers && providers.length > 0) {
		for (let i = 0; i < providers.length; i++) {
			const more = await page.evaluate(providers[i].provider, providers[i].key);
			if (more === null) {
				continue;
			}
			measurements = [...measurements, ...more];
		}
	}

	return measurements;

};

const measure = async(page, caching, targetConfig, config) => {

	const url = config.target.site + targetConfig.url;

	let keys = config.measurements;
	if (targetConfig.measurements && targetConfig.measurements.length > 0) {
		if (keys && keys.length > 0) {
			keys = [...keys, ...targetConfig.measurements];
		} else {
			keys = targetConfig.measurements;
		}
	}

	let measuringLogged = false;
	let ignoreMeasurement = caching;

	const result = {
		caching: caching,
		timestamp: helpers.getTimestamp(),
		measurements: []
	};

	const providers = getProviders(keys);

	while (result.measurements.length <= config.samplesPerTarget - 1) {

		await page.goto(url, {waitUntil: ['networkidle2', 'load']});

		if (login.isLoginPage(page.url(), config.target.login)) {

			if (!await login.login(page, config.target.login)) {
				process.exit(1);
			}

		} else {

			if (!measuringLogged) {
				process.stdout.write(`Measuring... ${chalk.blue(url)}; caching: ${caching}\n`);
				measuringLogged = true;
			}

			if (ignoreMeasurement) {
				ignoreMeasurement = false;
				continue;
			}

			process.stdout.write('.');

			result.measurements.push(await getMeasurements(page, providers));

		}
	}

	process.stdout.write('\n\n');

	return result;

};

module.exports = measure;
