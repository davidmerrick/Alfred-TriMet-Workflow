'use strict'

import alfy from 'alfy';
import fs from 'fs';
import TriMetAPI from 'trimet-api-client'

const CONFIG_FILE = "config.json";

fs.readFile(CONFIG_FILE, 'utf8', (err, data) => {
	let config = JSON.parse(data);
	const trimetClient = new TriMetAPI(config.trimetApiKey);
	let stops = config.stops;

	let promises = stops.map(stop => 
		trimetClient.getNextArrivalForBus(stop.stopId, stop.busId)
			.then(arrival => ({
				title: "Bus " + stopId,
				subtitle: arrival.getMinutesUntilArrival() + " min"
			})
	));

	Promise.all(promises).then(results => {
		alfy.output(results);
	});
});