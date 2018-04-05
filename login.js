
const chalk = require('chalk');

const loginHelper = {

	login: async(page, config) => {
		process.stdout.write('\nLogging in... ');

		const user = config.user.value;
		const password = config.password.value;

		await page.type(config.user.selector, user);
		await page.type(config.password.selector, password);
		await Promise.all([
			page.click(config.submit.selector),
			page.waitForNavigation({waitUntil: 'networkidle2'})
		]);

		if (!loginHelper.isLoginPage(page.url(), config)) {
			process.stdout.write(chalk.green('success!\n\n'));
			return true;
		} else {
			process.stdout.write(chalk.red('failed!\n\n'));
			return false;
		}

	},

	isLoginPage: (url, config) => {
		return (url.indexOf(config.url) > -1);
	}

};

module.exports = loginHelper;
