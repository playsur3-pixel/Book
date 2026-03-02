import { createBrowserRouter, Navigate } from "react-router-dom";
import App from "./App";
import Login from "../pages/Login";
import Home from "../pages/Home";
import Admin from "../pages/Admin";

import MirageStuffs from "../pages/stuffs/Mirage";
import MirageStrats from "../pages/strats/Mirage";
import Dust2Stuffs from "../pages/stuffs/Dust2";
import Dust2Strats from "../pages/strats/Dust2";
import InfernoStuffs from "../pages/stuffs/Inferno";
import InfernoStrats from "../pages/strats/Inferno";
import NukeStuffs from "../pages/stuffs/Nuke";
import NukeStrats from "../pages/strats/Nuke";
import OverpassStuffs from "../pages/stuffs/Overpass";
import OverpassStrats from "../pages/strats/Overpass";
import AncientStuffs from "../pages/stuffs/Ancient";
import AncientStrats from "../pages/strats/Ancient";
import AnubisStuffs from "../pages/stuffs/Anubis";
import AnubisStrats from "../pages/strats/Anubis";

export const router = createBrowserRouter([
  { path: "/login", element: <Login /> },

  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: "admin", element: <Admin /> },
      { path: "stuffs/mirage", element: <MirageStuffs /> },
      { path: "strats/mirage", element: <MirageStrats /> },
      { path: "maps/mirage", element: <Navigate to="/stuffs/mirage" replace /> },
      { path: "stuffs/dust2", element: <Dust2Stuffs /> },
      { path: "strats/dust2", element: <Dust2Strats /> },
      { path: "maps/dust2", element: <Navigate to="/stuffs/dust2" replace /> },
      { path: "stuffs/inferno", element: <InfernoStuffs /> },
      { path: "strats/inferno", element: <InfernoStrats /> },
      { path: "maps/inferno", element: <Navigate to="/stuffs/inferno" replace /> },
      { path: "stuffs/nuke", element: <NukeStuffs /> },
      { path: "strats/nuke", element: <NukeStrats /> },
      { path: "maps/nuke", element: <Navigate to="/stuffs/nuke" replace /> },
      { path: "stuffs/overpass", element: <OverpassStuffs /> },
      { path: "strats/overpass", element: <OverpassStrats /> },
      { path: "maps/overpass", element: <Navigate to="/stuffs/overpass" replace /> },
      { path: "stuffs/ancient", element: <AncientStuffs /> },
      { path: "strats/ancient", element: <AncientStrats /> },
      { path: "maps/ancient", element: <Navigate to="/stuffs/ancient" replace /> },
      { path: "stuffs/anubis", element: <AnubisStuffs /> },
      { path: "strats/anubis", element: <AnubisStrats /> },
      { path: "maps/anubis", element: <Navigate to="/stuffs/anubis" replace /> }
    ],
  },
]);
