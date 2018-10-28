'use strict'

const alfy = require('alfy');
const fs = require('fs');
const fetch = require("node-fetch");

const CONFIG_FILE = "config.json";

fs.readFile(CONFIG_FILE, 'utf8', (err, data) => {
	let config = JSON.parse(data);
	let stops = config.stops;

	let promises = stops.map(stop => 
		fetch("https://developer.trimet.org/ws/V1/arrivals?json=true&locIDs=" + stop.stopId + "&appID=" + config.trimetApiKey)
			.then(response => response.json())
			.then(json => {
				let arrivals = json.resultSet.arrival;
				arrivals.sort((a, b) => getNextArrivalTime(a) - getNextArrivalTime(b));
				let nextArrival = arrivals.filter(a => a.route == stop.busId)[0];
				return {
					title: stop.label,
					subtitle: "Bus " + stop.busId + ": " + getMinutesFromNow(getNextArrivalTime(nextArrival)) + " min",
					arg: "https://trimet.org/#tracker/stop/" + stop.stopId
				}
			})
	);

	Promise.all(promises).then(results => {
		alfy.output(results);
	});
});

function getNextArrivalTime(arrival){
	// estimated is more accurate. Prioritize that if it's present.
	if (arrival.estimated){
		return new Date(arrival.estimated);
	} 
	return new Date(arrival.scheduled);
}

function getMinutesFromNow(date){
	let diff = date - new Date();
	return Math.floor((diff/1000)/60);
}