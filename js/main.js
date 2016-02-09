requirejs.config({
	baseUrl : "js/",
	paths : {
		jquery : 'https://code.jquery.com/jquery-2.1.4.min',
		leaflet : 'http://cdn.leafletjs.com/leaflet-0.7.5/leaflet'
	}
});

require(['app'], function (app) {
	app.start();
});