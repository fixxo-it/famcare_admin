'use client'

import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api'
import { useCallback, useState, useEffect } from 'react'

const containerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '16px'
}

const center = {
  lat: 12.9716, // Bangalore
  lng: 77.5946
}

interface MapSDKProps {
  initialPosition?: { lat: number; lng: number }
  onPositionChange: (pos: { lat: number; lng: number }) => void
}

export default function MapSDK({ initialPosition, onPositionChange }: MapSDKProps) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: "AIzaSyCfmLF7CwoQ5nAra_Q-JJaFl6FnPeN7QU4"
  })

  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [markerPos, setMarkerPos] = useState(initialPosition || center)

  useEffect(() => {
    if (initialPosition) {
      setMarkerPos(initialPosition)
    }
  }, [initialPosition])

  const onLoad = useCallback(function callback(map: google.maps.Map) {
    setMap(map)
  }, [])

  const onUnmount = useCallback(function callback(map: google.maps.Map) {
    setMap(null)
  }, [])

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const newPos = { lat: e.latLng.lat(), lng: e.latLng.lng() }
      setMarkerPos(newPos)
      onPositionChange(newPos)
    }
  }

  const handleMarkerDragEnd = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const newPos = { lat: e.latLng.lat(), lng: e.latLng.lng() }
      setMarkerPos(newPos)
      onPositionChange(newPos)
    }
  }

  return isLoaded ? (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={markerPos}
      zoom={14}
      onLoad={onLoad}
      onUnmount={onUnmount}
      onClick={handleMapClick}
      options={{
        disableDefaultUI: true,
        zoomControl: true,
        styles: [
          {
            "featureType": "all",
            "elementType": "labels.text.fill",
            "stylers": [{ "saturation": 36 }, { "color": "#000000" }, { "lightness": 40 }]
          },
          {
            "featureType": "all",
            "elementType": "labels.text.stroke",
            "stylers": [{ "visibility": "on" }, { "color": "#000000" }, { "lightness": 16 }]
          },
          {
            "featureType": "all",
            "elementType": "labels.icon",
            "stylers": [{ "visibility": "off" }]
          },
          {
            "featureType": "administrative",
            "elementType": "geometry.fill",
            "stylers": [{ "color": "#000000" }, { "lightness": 20 }]
          },
          {
            "featureType": "administrative",
            "elementType": "geometry.stroke",
            "stylers": [{ "color": "#000000" }, { "lightness": 17 }, { "weight": 1.2 }]
          },
          {
            "featureType": "landscape",
            "elementType": "geometry",
            "stylers": [{ "color": "#000000" }, { "lightness": 20 }]
          },
          {
            "featureType": "poi",
            "elementType": "geometry",
            "stylers": [{ "color": "#000000" }, { "lightness": 21 }]
          },
          {
            "featureType": "road.highway",
            "elementType": "geometry.fill",
            "stylers": [{ "color": "#000000" }, { "lightness": 17 }]
          },
          {
            "featureType": "road.highway",
            "elementType": "geometry.stroke",
            "stylers": [{ "color": "#000000" }, { "lightness": 29 }, { "weight": 0.2 }]
          },
          {
            "featureType": "road.arterial",
            "elementType": "geometry",
            "stylers": [{ "color": "#000000" }, { "lightness": 18 }]
          },
          {
            "featureType": "road.local",
            "elementType": "geometry",
            "stylers": [{ "color": "#000000" }, { "lightness": 16 }]
          },
          {
            "featureType": "transit",
            "elementType": "geometry",
            "stylers": [{ "color": "#000000" }, { "lightness": 19 }]
          },
          {
            "featureType": "water",
            "elementType": "geometry",
            "stylers": [{ "color": "#000000" }, { "lightness": 17 }]
          }
        ]
      }}
    >
      <MarkerF
        position={markerPos}
        draggable
        onDragEnd={handleMarkerDragEnd}
        animation={window.google?.maps?.Animation?.DROP}
      />
    </GoogleMap>
  ) : (
    <div className="w-full h-full bg-white/5 animate-pulse rounded-2xl flex items-center justify-center text-muted-foreground text-xs">
      Loading Map...
    </div>
  )
}
