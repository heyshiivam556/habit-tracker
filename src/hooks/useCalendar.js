import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

export function useCalendar() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const { googleToken, clearGoogleToken, refreshGoogleToken } = useAuth();

  useEffect(() => {
    if (!googleToken) {
      setEvents([]);
      return;
    }

    const fetchEvents = async () => {
      setLoading(true);
      try {
        const timeMin = new Date().toISOString();
        const timeMax = new Date();
        timeMax.setDate(timeMax.getDate() + 7); // Fetch next 7 days
        
        const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax.toISOString())}&orderBy=startTime&singleEvents=true&maxResults=10`;
        
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${googleToken}` }
        });
        const data = await res.json();
        
        if (data.error) {
          console.error("Google Calendar API Error:", data.error);
          if (data.error.code === 401) {
            refreshGoogleToken();
          } else {
            alert(`Google Calendar Error: ${data.error.message}\n\nMake sure the "Google Calendar API" is enabled in your Google Cloud Console!`);
          }
          setEvents([]);
          return;
        }

        if (data.items) {
          const formattedEvents = data.items.map(event => {
            const start = event.start.dateTime || event.start.date;
            const end = event.end.dateTime || event.end.date;
            return {
              id: event.id,
              title: event.summary,
              start: new Date(start),
              end: new Date(end),
              isAllDay: !event.start.dateTime
            };
          });
          setEvents(formattedEvents);
        }
      } catch (error) {
        console.error("Failed to fetch Google Calendar events:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [googleToken]);

  return { events, loading };
}
