import React from 'react';

import mapboxgl from 'mapbox-gl';
import mapboxkeys from '../../config/keys_mapbox';
import '../../styles/map.scss'

class Map extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      lng: -122.44,
      lat: 37.76,
      zoom: 11,
      map: '',
      allMarkers: [],
    }
  }

  componentDidMount() {



    mapboxgl.accessToken = mapboxkeys.public_key;
    // Set the map's max bounds
    const bounds = [
      [-122.54, 37.6], // [west, south]
      [-122.34, 37.9]  // [east, north]
    ];

    const map = new mapboxgl.Map({
      container: this.mapContainer,
      style: 'mapbox://styles/mapbox/dark-v10',
      center: [this.state.lng, this.state.lat],
      zoom: this.state.zoom
    });

    map.addControl(new mapboxgl.NavigationControl());
    map.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true
        },
        trackUserLocation: true
      })
    );
    map.setMaxBounds(bounds);
    this.setState({ map });
    this.callPlaceMarkers();
  }
  // Calls place markers once the task and map are loaded
  // Recursively sets a timeout and calls itself if not loaded
  callPlaceMarkers() {
    if (this.state.map && this.props.tasks.length) {
      // console.log(this.props.tasks)
      this.placeMapMarkers(this.props.tasks);
      // console.log(this.props.tasks)
      // console.log(this.props.currentUserTasks);
      console.log(this.props.helpNeededTasks);

    } else {
      setTimeout(() => {

        this.callPlaceMarkers(this.props.tasks)
      }, 1 * 100)
    }
  }


  placeMapMarkers(tasks) {
    const { map } = this.state
    const allMarkers = [];
    const geojson = {
      type: 'FeatureCollection',
      features:
        tasks.map(task => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [task.deliveryLatLong[1], task.deliveryLatLong[0]]
          },
          properties: {
            title: `${task.type}`,
            deliveryAddress: task.deliveryAddress,
            taskId: task._id,
            volunteerId: task.volunteer,
            status: task.status
          }
        }))
    };
    // add markers to map
    geojson.features.forEach((marker) => {
      // create a HTML element for each feature
      const el = document.createElement('div');
      const volunteerId = marker.properties.volunteerId
      const status = marker.properties.status
      const { currentUserId } = this.props

      if (volunteerId !== null && volunteerId === currentUserId && status === 1) {
        el.className = 'marker active'
      } else if (volunteerId === currentUserId && status === 2) {
        el.className = 'marker inActive'
      } else {
        el.className = 'marker completed'
      }
      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: false,
        closeOnClick: false,
      }) // add popups
        .setHTML(
          '<h3>' + marker.properties.title + '</h3>'
          + '<p>' + 'Volunteer Needed' + '</p>'
        )
      // make a marker for each feature and add to the map
      const mapBoxMarker = new mapboxgl.Marker(el)
        .setLngLat(marker.geometry.coordinates)
        .setPopup(popup)
        .addTo(this.state.map);
      // Add mapBox marker and associated id to array
      allMarkers.push({ mBMarker: mapBoxMarker, id: marker.properties.taskId });

      const markerEl = mapBoxMarker.getElement();
      markerEl.addEventListener('mouseenter', () => {
        // Add popup to map 
        popup.addTo(map);
      });
      markerEl.addEventListener('mouseleave', () => {
        // Remove popup from map
        popup.remove();
      });
    });

    this.setState({ allMarkers });
  }

  updatePopups() {
    const { allMarkers, map } = this.state;
    const { activeTask } = this.props;
    allMarkers.length && allMarkers.forEach((markerObj) => {
      const { mBMarker, id } = markerObj;
      if (
        activeTask && activeTask.taskId === id && !mBMarker.getPopup().isOpen()
      ) {
        mBMarker.getPopup().addTo(map)
      } else if (mBMarker.getPopup().isOpen()) {
        mBMarker.getPopup().remove();
      }
    })
  }

  render() {
    { this.updatePopups() }
    return (
      < div >
        <div ref={el => this.mapContainer = el} className="mapContainer" />
      </div >
    )
  }
}


export default Map;