
const chalk = require('chalk');
const math = require('mathjs');

const processor = {

	evaluate: (measurements) => {

		const results = [];

		const getMeasurementsByName = (samples) => {

			const result = samples.reduce((measurements, sample) => {
				return sample.reduce((measurements, measurement) => {
					const key = `${measurement.name}:${measurement.entryType}`;
					if (!measurements[key]) {
						measurements[key] = [];
					}
					measurements[key].push(measurement);
					return measurements;
				}, measurements);
			}, {});

			return result;

		};

		const calculateStdMean = (values) => {

			const std = math.std(values);
			const mean = math.mean(values);
			const keep = [];

			for (let i = 0; i < values.length; i++) {
				if (math.abs(values[i] - mean) > std * 2) {
					process.stdout.write(`${chalk.gray(Math.round(values[i]) + 'ms')} `);
				} else {
					process.stdout.write(`${Math.round(values[i])}ms `);
					keep.push(values[i]);
				}
			}

			const meanStd = math.mean(keep);

			process.stdout.write(`\nstd: ${Math.round(std)}ms; `);
			process.stdout.write(`mean: ${Math.round(mean)}ms; `);
			process.stdout.write(`${chalk.green('mean(std)')}: ${Math.round(meanStd)}ms`);

			return meanStd;

		};

		measurements = getMeasurementsByName(measurements);

		for (const measurementName in measurements) {
			if (measurements.hasOwnProperty(measurementName)) {

				const result = {
					name: measurements[measurementName][0].name,
					entryType: measurements[measurementName][0].entryType
				};

				process.stdout.write(`\n${chalk.blue(measurementName)}`);
				process.stdout.write('\nstartTime: ');
				result.startTime = Math.round(calculateStdMean(measurements[measurementName].map(m => m.startTime)));
				process.stdout.write('\nduration: ');
				result.duration = Math.round(calculateStdMean(measurements[measurementName].map(m => m.duration)));

				process.stdout.write('\n');

				results.push(result);
			}
		}

		process.stdout.write('\n\n');

		return results;

	}

};

module.exports = processor;
