import React, { useState, useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { io } from "socket.io-client";

// Fix default Leaflet marker icons in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL(
    "leaflet/dist/images/marker-icon-2x.png",
    import.meta.url
  ).href,
  iconUrl: new URL("leaflet/dist/images/marker-icon.png", import.meta.url).href,
  shadowUrl: new URL("leaflet/dist/images/marker-shadow.png", import.meta.url)
    .href,
});

const MyLocationMap = () => {
  const [Position, setPosition] = useState(null);
  const [users, setUsers] = useState([]);
  const [roomName, setRoomName] = useState("");
  const [Name, setName] = useState("");
  const socket = useMemo(() => io("http://localhost:8000"), []);

  const handleSubmit = (e) => {
    e.preventDefault();
    socket.emit("join-room", { roomName, Name });
    setRoomName("");
    setName("");
  };

  useEffect(() => {
    if (!navigator.geolocation) {
      alert(
        "Geolocation service is not supported by your browser or you have declined the service"
      );
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setPosition(coords);
        socket.emit("send-current-location", coords);
      },
      (err) => {
        console.log("Geolocation error", err);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );

    socket.on("user-update", (data) => {
      console.log(data);
      setUsers(data);
    });

    return () => {
      navigator.geolocation.clearWatch(watchId);
      socket.off("users-update");
    };
  }, []);

  // If location not yet loaded, show nothing or loading message
  if (!Position) return <p>Loading your location...</p>;

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={roomName}
          placeholder="Room Name"
          onChange={(e) => {
            setRoomName(e.target.value);
          }}
        />
        <input
          type="text"
          value={Name}
          placeholder="Name"
          onChange={(e) => {
            setName(e.target.value);
          }}
        />
        <button type="submit">Join Room</button>
      </form>
      <MapContainer
        center={Position}
        zoom={16}
        style={{ height: "100vh", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="Souptik"
        />
        
        {users.map((user) => (user.id!== socket.id ? 
          <Marker
            key={user.id}
            position={[user.position.lat, user.position.lng]}
          >
            <Popup>{`User: ${user.name}`}</Popup>
          </Marker>
          : 
          <Marker position={Position}>
          <Popup>You!!</Popup>
        </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default MyLocationMap;
