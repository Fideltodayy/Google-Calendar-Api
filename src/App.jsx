import {
  useSession,
  useSupabaseClient,
  useSessionContext,
} from "@supabase/auth-helpers-react";
import { useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import DateTimePicker from "react-datetime-picker";

function App() {
  const [start, setStart] = useState(new Date());
  const [end, setEnd] = useState(new Date());
  const [eventName, setEventName] = useState("");
  const [eventDescription, setEventDescription] = useState("");

  const supabase = useSupabaseClient(); //talks to the supabase client
  const session = useSession(); //User but a bunch of things gets stored here like current active tokens
  const { isLoading } = useSessionContext(); //isLoading is a boolean that tells us if the session is loading or not

  if (isLoading) {
    return <></>;
  }

  const googleSignIn = async () => {
    try {
      const { user, session, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          scopes:
            "https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar",
        },
      });
      if (error) {
        console.error(
          "Error logging in with Google provider with supabase:",
          error
        );
        toast.error("Failed to sign in with Google");
      } else {
        console.log("Google sign in successful:", user, session);
        toast.success("Successfully connected to Google Calendar!");
      }
    } catch (error) {
      console.error("Error signing in with Google:", error);
      toast.error("Failed to sign in with Google");
    }
  };

  const googleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error signing out with Google provider:", error);
        toast.error("Failed to sign out with Google");
      } else {
        console.log("Google sign out successful");
        toast.info("Disconnected from Google Calendar");
      }
    } catch (error) {
      console.error("Error signing out with Google:", error);
      toast.error("Failed to sign out with Google");
    }
  };

  const createCalendarEvent = async () => {
    console.log("Creating calendar event...", start, end, eventName);
    if (!start || !end || !eventName) {
      toast.error(
        "Please ensure you have selected a start and end date and entered an event name"
      );
      return;
    }
    const event = {
      summary: "Registtration for Lesson: " + eventName,
      location: "Google Meet (link will be provided)",
      description: eventDescription,
      start: {
        dateTime: start.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: new Date(start.getTime() + 30 * 60000).toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      attendees: [],
      conferenceData: {
        createRequest: {
          requestId: "sample123",
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
    };

    await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.provider_token}`,
        },
        body: JSON.stringify(event),
      }
    )
      .then((data) => {
        return data.json();
      })
      .then((res) => {
        console.log(res);
        toast.success("Virtual lesson scheduled successfully!");
        setStart(new Date());
        setEnd(new Date());
        setEventName("");
        setEventDescription("");
      })
      .catch((error) => {
        console.error("Error scheduling virtual lesson:", error);
        googleSignOut();
        toast.error("Failed to schedule virtual lesson");
      });
  };

  console.log(session);
  console.log(start);
  console.log(eventDescription);
  return (
    <>
      <div style={{ width: "400px", margin: "30px auto" }}>
        {session ? (
          <>
            <h1>Welcome {session.user.email}</h1>
            <h2>Start Date of the event</h2>
            <DateTimePicker onChange={setStart} value={start} />
            <h2>End Date of the event</h2>
            <DateTimePicker onChange={setEnd} value={end} />
            <h2>Event Name</h2>
            <input
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
            />
            <h2>Event Description</h2>
            <input
              type="text"
              value={eventDescription}
              onChange={(e) => setEventDescription(e.target.value)}
            />

            <br />
            <br />

            <button onClick={() => createCalendarEvent()}>Create Event</button>
            <br />

            <button onClick={() => googleSignOut()}>Sign Out</button>
          </>
        ) : (
          <>
            <h1>Sign In</h1>
            <button onClick={() => googleSignIn()}>Sign In with Google</button>
          </>
        )}
      </div>
      <ToastContainer />
    </>
  );
}

export default App;
