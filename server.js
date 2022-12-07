/* eslint-disable no-undef */
import express from 'express'
import cors from 'cors'
import fileUpload from 'express-fileupload'
import fs from 'fs'
import {log, logObj, logs} from 'xeue-logs'
import config from 'xeue-config'
import path from 'path'
import {fileURLToPath} from 'url'
import ejs from 'ejs'

import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const {version} = require('./package.json')

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

config.useLogger(logs)

{ /* Config setup */
	console.clear()
	config.default('port', 8080)
	config.default('installName', 'Unknown Site')
	config.default('debugLineNum', false)
	config.default('loggingLevel', 'W')
	config.default('createLogFile', true)
	config.default('devMode', false)

	config.require('port')
	config.require('installName', [], 'Name of the site, this appears in the tab in browser')
	config.require('loggingLevel', ['A','D','W','E'], 'What level of logs should be recorded (A)ll (D)ebug (W)arning (E)rror')
	config.require('createLogFile', [true, false], 'Generate log file')

	if (!await config.fromFile(__dirname + '/config.conf')) {
		logs.printHeader('Web Canvas')
		await config.fromCLI(__dirname + '/config.conf')
	}

	logs.setConf({
		'createLogFile': config.get('createLogFile'),
		'logsFileName': 'WebCanvasLogging',
		'configLocation': __dirname,
		'loggingLevel': config.get('loggingLevel'),
		'debugLineNum': config.get('debugLineNum')
	})
	logs.printHeader('Web Canvas')

	config.userInput(async (command)=>{
		switch (command) {
		case 'config':
			await config.fromCLI(__dirname + '/config.conf')
			logs.setConf({
				'createLogFile': config.get('createLogFile'),
				'logsFileName': 'WebCanvasLogging',
				'configLocation': __dirname,
				'loggingLevel': config.get('loggingLevel'),
				'debugLineNum': config.get('debugLineNum')
			})
			return true
		}
	})
	log('Running version: v'+version, ['H', 'SERVER', logs.g])
	config.print()
}

const app = express()
await folderExists(__dirname+'/public/saves', true)

{ /* Express setup & Endpoints */
	app.set('views', __dirname + '/views')
	app.set('view engine', 'ejs')
	app.use(cors())
	app.use(express.json())
	app.use(express.static('public'))
	app.use(express.urlencoded({ extended: true }))
	app.use(fileUpload({
		createParentPath: true
	}))

	app.listen(config.get('port'), '0.0.0.0', () => {
		log(`Web Canvas can be accessed at http://localhost:${config.get('port')}`, ['C', 'SERVER', logs.g])
	})

	app.get('/',  (req, res) =>  {
		doHome(req, res)
	})

	app.get('/editor',  (req, res) =>  {
		doEditor(req, res)
	})
}

/* Request functions */

async function doHome(req, res) {
	log('Client requesting home page', 'A')
	res.header('Content-type', 'text/html')

	res.render('home', {
		serverName: config.get('installName'),
		version: version,
        currentLinks: currentLinks
	})
}
async function doEditor(req, res) {
	log('New Render Page Spawned', 'A')
	res.header('Content-type', 'text/html')

	res.render('editor', {
        serverName: config.get('installName'),
		version: version,
        currentLinks: currentLinks
	})
}

const currentLinks = []



/* Utility Functions */

async function folderExists(path, makeIfNotPresent = false) {
	let found = true
	try {
		await fs.promises.access(path)
	} catch (error) {
		found = false
		if (makeIfNotPresent) {
			log(`Folder: ${logs.y}(${path})${logs.reset} not found, creating it`, 'D')
			try {
				await fs.promises.mkdir(path, {'recursive': true})
			} catch (error) {
				log(`Couldn't create folder: ${logs.y}(${path})${logs.reset}`, 'W')
				logObj('Message', error, 'W')
			}
		} else {
			log(`Folder: ${logs.y}(${path})${logs.reset} not found`, 'D')
		}
	}
	return found
}