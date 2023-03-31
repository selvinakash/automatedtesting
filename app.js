'use strict';

global.config = {};

const path = require('path');

/**
 * loading the environment information should be THE first thing
 */
require('dotenv').config();

var config = require('./_config/config.json');
global.config = config;

global.db = require("./_core/js/database")
/**
 * override config with information from env variables
 */
for (var key in config) {
	if (process.env[key]) {
		// if the env variable has a string thats valid JSON then parse it to be so
		try {
			config[key] = JSON.parse(process.env[key]);
		} catch (e) {
			config[key] = process.env[key];
		}
	}
}

/**
 * handle normal app exit
 */
process.on('exit', function (e) {
	console.log('app exit');
	process.exit();
});

/**
 * handle force shutdown application event
 */
process.on('SIGINT', function () {
	console.log('Ctrl-C...');
	process.exit();
});

/**
 * handle uncaught exceptions
 */
process.on('uncaughtException', function (e) {
	console.log('Uncaught Exception...');
	console.log(e.stack);
	process.exit();
});

/**
 * setup fastify instance
 */
const app = require('fastify')({
	bodyLimit: 20971520,
	logger: false,
});

// register plugins
app.register(require('@fastify/compress'));
// app.register(require('@fastify/helmet'));
const fastifyStatic = require('@fastify/static')


app.register(fastifyStatic, {
	root: path.join(__dirname, 'reports'),
	prefix: '/',
});

app.register(require('@fastify/formbody'));

/**
 * make fastify listen on specific port
 */
var routers = require('./_core/routers.js')(app);
app.listen({ port: config.port, host: '0.0.0.0' }, (err, address) => {
	if (err) {
		app.log.error(err);
		process.exit(1);
	}
	app.log.info(`server listening on ${address}`);
	console.log('                              +-+-+-+-+-+-+-+-+-+-+-+-+-+');
	console.log('                              |      Testing server     |');
	console.log('                              +-+-+-+-+-+-+-+-+-+-+-+-+-+');
	console.log('\nServing at', address);
});

/**
 * handle all routes that are not defined
 */
app.setNotFoundHandler(function (req, reply) {
	reply.status(404).send({
		status: {
			code: 404,
			message:
				'You have used an incorrect request method (GET instead of POST?) or the requested resource does not exist',
		},
	});
});
