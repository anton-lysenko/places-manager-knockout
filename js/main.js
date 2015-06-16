var defaultLocations = [
    {
        name: "Proletarskaya",
        lat: 49.078135020912484,
        lng: 33.411639160156255,
        visible: true
    },
    {
        name: "Armeyskaya",
        lat: 49.067339299136805,
        lng: 33.397906250000005,
        visible: true
    },
];

var currentInfoWindow = null;

var mapCenter = new google.maps.LatLng(49.067339299136805, 33.397906250000005);
var map = new google.maps.Map(document.getElementById('map-canvas'), {
    zoom: 10,
    center: mapCenter,
    mapTypeId: google.maps.MapTypeId.ROADMAP
});

function clearOverlay() {
    if (currentInfoWindow) {
        currentInfoWindow.close();
    }
}

function placeMarker(data) {
    var self = this;

    self.name = data.name;
    self.lat = ko.observable(data.lat);
    self.long = ko.observable(data.lng);
    self.latlng = ko.computed(function () {
        return self.lat() + ", " + self.long();
    });
    self.visible = data.visible;
    self.marker = new google.maps.Marker({
        position: new google.maps.LatLng(data.lat, data.lng),
        title: self.name,
        map: map,
        draggable: true
    });

    self.infoWindow = function (model) {

        clearOverlay();

        var infowindow = new google.maps.InfoWindow({
            content: model.name
        });
 
        infowindow.open(map, self.marker);
        currentInfoWindow = infowindow;
    };

    //if you need the poition while dragging
    google.maps.event.addListener(self.marker, 'drag', function () {
        var pos = self.marker.getPosition();
        self.lat(pos.lat());
        self.long(pos.lng());
    });

    //if you just need to update it when the user is done dragging
    google.maps.event.addListener(self.marker, 'dragend', function () {
        var pos = self.marker.getPosition();
        self.lat(pos.lat());
        self.long(pos.lng());
    });

    //show info window on marker click
    google.maps.event.addListener(self.marker, 'click', function () {
        self.infoWindow(data);
    });

}

var ViewModel = function () {
    var self = this;

    self.favouritePlaces = ko.observableArray([]);

    self.filteredPlaces = ko.observableArray([]);

    self.searchQuery = ko.observable("");

    self.filterPlaces = function (value) {
        self.filteredPlaces.removeAll();
        self.favouritePlaces().forEach(function (item, index) {
            if (item.name.toLowerCase().indexOf(self.searchQuery().toLowerCase()) >= 0) {
                item.visible = true;
                item.marker.setMap(map);
                self.filteredPlaces.push(item);
            } else {
                item.visible = false;
                item.marker.setMap(null);
                self.filteredPlaces.push(item);
            }
        });
        self.favouritePlaces.removeAll();
        self.favouritePlaces(self.filteredPlaces.slice(0));
    };

    self.copyPlacesArray = function () {
        self.filteredPlaces(self.favouritePlaces.slice(0));
    };

    self.deletePlace = function (place) {
        var itemName = place.name;

        self.favouritePlaces.remove(function (place) {
            if (itemName == place.name) {
                place.marker.setMap(null);
                place.marker = null;
                return true;
            }
        });
        self.update();
    }
    self.update = function () {
        var temp = [];
        self.favouritePlaces().forEach(function (location) {
            var locationData = {};
            var pos = location.marker.getPosition();
            locationData.name = location.name;
            locationData.lat = pos.lat();
            locationData.lng = pos.lng();
            locationData.visible = location.visible;
            console.log(locationData);
            temp.push(locationData);
        });
        localStorage.favouritePlaces = JSON.stringify(temp);
    };
    
    if (!localStorage.favouritePlaces) {
        localStorage.favouritePlaces = JSON.stringify(defaultLocations);
    }
    placesData = JSON.parse(localStorage.favouritePlaces);
    placesData.forEach(function (location) {
        self.favouritePlaces.push(new placeMarker(location));
    });

    //Add favourite place by clicking on map
    google.maps.event.addListener(map, 'click', function (e) {

        var geocoder = new google.maps.Geocoder();

        var markedPlace = {
            lat: e.latLng.lat(),
            lng: e.latLng.lng(),
            visible: true
        };

        geocoder.geocode({
            location: markedPlace
        }, function (results, status) {

            markedPlace.name = results[0].formatted_address;
            self.favouritePlaces.push(new placeMarker(markedPlace));
            self.update();
        });

    });

};

var indexView = new ViewModel();

indexView.searchQuery.subscribe(indexView.filterPlaces);

ko.applyBindings(indexView);