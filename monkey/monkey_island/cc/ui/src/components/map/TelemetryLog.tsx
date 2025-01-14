import React, {useEffect, useRef, useState} from 'react';
import AuthComponent from '../AuthComponent';
import LoadingIcon from '../ui-components/LoadingIcon';


const authComponent = new AuthComponent({});
const telemetryUpdatePeriod = 5000; // UI will fetch telemetries every N milliseconds.

const TelemetryLog = (props: { onStatusChange: Function }) => {

  let [telemetriesLoading, setTelemetriesLoading] = useState(true);
  let [telemetryUpdateInProgress, setTelemetryUpdateInProgress] = useState(false);
  let [telemetry, setTelemetry] = useState([]);
  let [lastTelemetryTimestamp, setLastTelemetryTimestamp] = useState(null);
  let [isScrolledUp, setIsScrolledUp] = useState(false);
  let [telemetryLines, setTelemetryLines] = useState(0);
  let [telemetryCurrentLine, setTelemetryCurrentLine] = useState(0);

  let scrollTop = 0;
  const telemetryConsole = useRef(null);

  useEffect(() => {
    updateTelemetryFromServer();
    const interval = setInterval(updateTelemetryFromServer, telemetryUpdatePeriod);
    return function cleanup() {
      clearInterval(interval);
    };
  }, []);

  function updateTelemetryFromServer() {
    if (telemetryUpdateInProgress) {
      return
    }
    setTelemetryUpdateInProgress(true);
    authComponent.authFetch('/api/telemetry-feed?timestamp=' + lastTelemetryTimestamp)
      .then(res => res.json())
      .then(res => {
        if ('telemetries' in res) {
          let newTelem = telemetry.concat(res['telemetries']);
          setTelemetry(newTelem);
          setLastTelemetryTimestamp(res['timestamp']);
          setTelemetryUpdateInProgress(false);
          setTelemetriesLoading(false);
          props.onStatusChange();

          let telemConsoleRef = telemetryConsole.current;
          if (!isScrolledUp) {
            telemConsoleRef.scrollTop = telemConsoleRef.scrollHeight - telemConsoleRef.clientHeight;
            scrollTop = telemConsoleRef.scrollTop;
          }
        }
      });
  }

  function handleScroll(e) {
    let element = e.target;

    let telemetryStyle = window.getComputedStyle(element);
    let telemetryLineHeight = parseInt((telemetryStyle.lineHeight).replace('px', ''));

    setIsScrolledUp((element.scrollTop < scrollTop));
    setTelemetryCurrentLine(Math.trunc(element.scrollTop / telemetryLineHeight) + 1);
    setTelemetryLines(Math.trunc(element.scrollHeight / telemetryLineHeight));
  }

  function renderTelemetryConsole() {
    return (
      <div className="telemetry-console" onScroll={handleScroll} ref={telemetryConsole}>
        {
          telemetry.map(renderTelemetryEntry)
        }
      </div>
    );
  }

  function renderTelemetryEntry(telemetry) {
    return (
      <div key={telemetry.id}>
        <span className="date">{telemetry.timestamp}</span>
        <span className="source"> {telemetry.hostname}:</span>
        <span className="event"> {telemetry.brief}</span>
      </div>
    );
  }

  function renderTelemetryLineCount() {
    return (
      <div className="telemetry-lines">
        <b>[{telemetryCurrentLine}/{telemetryLines}]</b>
      </div>
    );
  }

  return (
    <div className={'telemetry-log-section'}>
      {telemetriesLoading && <LoadingIcon/>}
      {renderTelemetryLineCount()}
      {renderTelemetryConsole()}
    </div>);
}

export default TelemetryLog;
