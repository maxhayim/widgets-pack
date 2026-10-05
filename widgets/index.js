import calculator from "./calculator/widget.jsx";
import calendar from "./calendar/widget.jsx";
import clock from "./clock/widget.jsx";
import convert from "./convert/widget.jsx";
import flightTracker from "./flight-tracker/widget.jsx";
import mesh from "./mesh/widget.jsx";
import photoGallery from "./photo-gallery/widget.jsx";
import radio from "./radio/widget.jsx";
import stickyNotes from "./sticky-notes/widget.jsx";
import stocks from "./stocks/widget.jsx";
import translator from "./translator/widget.jsx";
import weather from "./weather/widget.jsx";
import worldClock from "./world-clock/widget.jsx";

// Every widget: { id, label, Widget, Settings? }. id matches its folder.
export const WIDGETS = [clock, radio, weather, mesh, calculator, calendar, stickyNotes, worldClock, photoGallery, convert, translator, flightTracker, stocks];
export { calculator, calendar, clock, convert, flightTracker, mesh, photoGallery, radio, stickyNotes, stocks, translator, weather, worldClock };
