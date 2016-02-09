define(['jquery', 'leaflet'], function ($, L) {
	
	"use strict";

	var markers = [],		
		sdotTot = 0,
		wsdotTot = 0,
		map;

	/**
	 * Initializes a leaflet map centered at Seattle.
	 * @param  array loc  	Seattle's lat and long.
	 * @param  int 	 zoom 	Initial map zoom.
	 */
	function createMap(loc, zoom) {
		var ACCESS_TOKEN = "pk.eyJ1IjoiZW1hcmtvdmljIiwiYSI6ImNpZnNocHQyMzFoeDJzcGtyOTZua3U5YzUifQ.iriFvTKtSGI1Y9VVzNPgIA",
			ID = "mapbox.outdoors";
		map = L.map('map').setView(loc, zoom);	
		L.tileLayer('https://api.tiles.mapbox.com/v4/' + ID + '/{z}/{x}/{y}.png?access_token=' + ACCESS_TOKEN, {
		    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>'
		}).addTo(map);		
	}

	/**
	 * Gets some Seattle traffic camera data from the Seattle Open Data Project and creates
	 * camera markers.
	 */
	function getData() {		
		$.getJSON('https://data.seattle.gov/resource/65fc-btcc.json') 
			.then(createMarkers)
			.then(fitMapBounds)
			.then(updateTotals);
	}

	/**
	 * Creates and places markers representing traffic cameras on the map.
	 * @param  array data Traffic camera data;
	 * @return array      All markers on the map.
	 */
	function createMarkers(data) {
		var markerGrp = [];

		data.forEach(function (camera) {	
			var marker, sdot, color;
			
			if (camera.ownershipcd === "SDOT") {
				sdotTot++;
				color = "#14C0CC";
				sdot = true;
			} else {
				wsdotTot++;
				color = "#513DCC"
				sdot = false;
			}
			marker = L.circleMarker(
				[camera.location.latitude, camera.location.longitude], 
				{color : color}
			)
				.addTo(map)							
				.bindPopup(
					"<p>" + 
					camera.cameralabel + 
					"</p><img src=" + 
					camera.imageurl.url + 
					">", 
					{className : "cam-picture"}
				);	
			markers.push({
				name : camera.cameralabel,
				sdot : sdot,
				marker : marker
			});
			markerGrp.push(marker);			
		});
		return markerGrp;
	}

	/**
	 * Fixes the initial camera zoom to include all of the markers on the map.
	 * @param  array markerGrp 	All markers on the map.
	 */
	function fitMapBounds(markerGrp) {
		var group = L.featureGroup(markerGrp);
		map.fitBounds(group.getBounds());
	}

	/**
	 * Updates the sdot and wsdot camera count in the filter area on the map.
	 */
	function updateTotals() {
		$('#count').html(
			sdotTot + 
			" <span class='sdot'>SDOT</span>, " + 
			wsdotTot + 
			" <span class='wsdot'>WSDOT</span>"
		);
	}

	/**
	 * Filters the markers on the page to only show the markers that
	 * match the specified filter. Updates sdot and wsdot count.
	 * @param  String filter 	Filter typed into input box.
	 */
	function filterMarkers(filter) {
		sdotTot = 0;
		wsdotTot = 0;
		markers.forEach(function (marker) {
			var filtered = marker.name.toLowerCase().indexOf(filter) >= 0;

			if (map.hasLayer(marker.marker)) {
				if (!filtered) {
					map.removeLayer(marker.marker);
				}				
			} else {
				if (filtered) {
					map.addLayer(marker.marker);
				}
			}
			if (filtered) {
				if (marker.sdot) {
					sdotTot++
				} else {
					wsdotTot++;
				}
			}
		});
		updateTotals();
	}

	/**
	 * Checks if the marker popup collided with the filter box, only works 
	 * on larger screens.
	 * @param  element popup     The popup element.
	 * @param  element filterBox The filter box element.
	 * @return boolean           If popup and filter collided.
	 */
	function checkCollision(popup, filterBox) {
		var popupOffset = popup.offset(),
			filterOffset = filterBox.offset(),
			leftCorner,
			rightCorner,

			filterLeft = filterOffset.left,
			filterRight = filterOffset.left + filterBox.outerWidth(),
			filterTop = filterOffset.top,
			filterBot = filterOffset.top + filterBox.outerHeight(),

			popupLeftX = popupOffset.left,
			popupRightX = popupOffset.left + popup.outerWidth(),
			popupY = popupOffset.top;

			//popups go off the screen have neg Y values, correcting for that
			if (popupY < 0) {
				popupY = 2;
			}

			//checks if left popup corner is in filter box area
			leftCorner = 
				popupY >= filterTop && 
				popupY <= filterBot && 
				popupLeftX >= filterLeft && 
				popupLeftX <= filterRight;
			//checks if right popup corner is in filter box area
			rightCorner = 
				popupY >= filterTop && 
				popupY <= filterBot &&
				popupRightX >= filterLeft &&
				popupRightX <= filterRight;					
			return leftCorner || rightCorner;	
				
	}

	return {
		start : function () {
			createMap([47.6097, -122.3331], 13);
			getData(map);

			//on keyup, filters the markers
			$('#filter').keyup(function () {
				filterMarkers(this.value.toLowerCase());
			});

			//on popup, checks to see if popup collided with filter box, 
			//pans away from the filterbox if it did
			map.on('popupopen', function (e) {
				var popup = $(e.popup._container),
					filterBox = $('#filter-box'),
					popupTop = popup.offset().top,
					filterHeight = filterBox.outerHeight();

				//popups go off the screen have neg Y values, correcting for that
				if (popupTop < 0) {
					popupTop = 2;
				}

				if (checkCollision(popup, filterBox)) {
					//the '-4' is to give the popup and filter box some room
					map.panBy([0, popupTop - filterHeight - 4]);
				}
			})
		}
	}
});



