'use strict'

const alfy = require('alfy');
const fs = require('fs');
const fetch = require("node-fetch");

const CONFIG_FILE = "config.json";

fs.readFile(CONFIG_FILE, 'utf8', (err, data) => {
	let config = JSON.parse(data);
    let stops = config.stops;
    let query = process.argv[2] || "";

    let promises = stops
        .filter(stop => stop.label.indexOf(query) != -1)
        .map(stop => 
            fetch("https://developer.trimet.org/ws/V1/arrivals?json=true&locIDs=" + stop.stopId + "&appID=" + config.trimetApiKey)
                .then(response => response.json())
                .then(json => {
                    let arrivals = json.resultSet.arrival;
                    arrivals.sort((a, b) => getNextArrivalTime(a) - getNextArrivalTime(b));
                    return arrivals.filter(a => a.route == stop.busId)
                                .map(a => formatArrival(a, stop));
                    
                })
        );

	Promise.all(promises).then(results => {
        alfy.output(getOutput(results));
	});
});

function getOutput(results){
    if(results.length == 0){
        return [];
    }

    // flatMap output
    return results.reduce((a, b) => a.concat(b));
}

function formatArrival(arrival, stop) {
    let minsFromNow = getMinutesFromNow(getNextArrivalTime(arrival));
    if (stop.hasOwnProperty('offset')) {
        minsFromNow += stop.offset;
    }
    return {
        title: stop.label,
        subtitle: "Bus " + stop.busId + ": " + minsFromNow + " min",
        arg: "https://trimet.org/#tracker/stop/" + stop.stopId
    }
}

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