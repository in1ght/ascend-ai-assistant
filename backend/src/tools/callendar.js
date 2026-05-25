require(`dotenv`).config();
const { tool } = require("langchain");
const { z } = require("zod");
const { google } = require("googleapis"); 
const calendar = google.calendar("v3"); 
const TIME_ZONE = "Europe/Vienna";
const DEFAULT_CALENDAR_NAME = "AscendAI";
const DEFAULT_EVENT_DESCRIPTION = "Created by AscendAI assistant.";

const addMinutesToLocalDateTime = (dateTime, minutes) => {
  const date = new Date(dateTime);
  date.setMinutes(date.getMinutes() + minutes);

  const pad = (value) => String(value).padStart(2, "0");
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join("-") + "T" + [
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join(":");
};

const createCalendar = async (auth, summary, timeZone = TIME_ZONE) => { 
  const res = await calendar.calendars.insert({ 
    auth, 
    requestBody: { 
      summary, 
      timeZone, 
    }, 
  }); 

  return res.data; 
}; 


const createCalendarEvent_old = (calendarID, description, location, summary, startDate, endDate) => {
    // TimeZone -> by ip or just auto to Europe
    var timeZone = `Europe/London`;
    // create start date/time
    // var startDate = `2026-04-30T13:00:00.000`;
    // var endDate = `2021-04-30T14:00:00.000`;
    var start = {
        dateTime: startDate,
        timeZone: timeZone
    };
    var end = {
        dateTime: endDate,
        timeZone: timeZone
    };

    // // add attendees - repeat as necessary to add more
    // var attendees = [
    //     {email: `example1@example.com`},
    //     {email: `example2@example.com`}
    // ];

    // AUTO
    var sendUpdates = `all`;
    var guestsCanInviteOthers = false;
    var guestsCanModify = true;
    var guestsCanSeeOtherGuests = false;
    var transparency = `opaque`; // `transparent` = Available // `opaque` = Busy
    var visibility = `default`;

    // compile all of the above options for the event
    var resource = {
        summary,
        description,
        start,
        end,
        conferenceData,
        attendees,
        location,
        guestsCanInviteOthers,
        guestsCanModify,
        guestsCanSeeOtherGuests,
        transparency,
        visibility
    };
    var args = {
        conferenceDataVersion: 1,
        sendUpdates
    };

    // make call to Calendar API to create event
    var request = Calendar.Events.insert(resource, calendarID, args);

    // const newCal = await createCalendar(auth, "My App Calendar"); // AI
    // const calendarID = newCal.id; // AI

    // createCalendarEvent(calendarID, ...); // existing

    // capture event ID and log it
    var eventID = request.id;
    Logger.log(`Created Event: ` + eventID);

    // capture event HTML link and log it
    var eventHTML = request.htmlLink;
    Logger.log(`Event HTML Link is: ` + eventHTML);
}

const createCalendarEvent = async (input, metadata = {}) => {
  const accessToken = metadata.calendarAccessToken;
  if (!accessToken) {
    throw new Error("Calendar access is missing. Ask the user to sign in again.");
  }

  const auth = new google.auth.OAuth2(
    process.env.OAUTH_CLIENT_ID,
    process.env.OAUTH_CLIENT_SECRET
  );
  auth.setCredentials({ access_token: accessToken });

  const start = new Date(input.startDateTime);
  if (Number.isNaN(start.getTime())) {
    throw new Error("Invalid event date or time.");
  }

  const durationMinutes = input.durationMinutes || 60;
  const timeZone = input.timeZone || metadata.clientTimeZone || TIME_ZONE;
  const summary = input.summary?.trim() || "AscendAI hiking plan";
  const description = input.description?.trim() || DEFAULT_EVENT_DESCRIPTION;
  const endDateTime = addMinutesToLocalDateTime(input.startDateTime, durationMinutes);
  const newCalendar = await createCalendar(auth, DEFAULT_CALENDAR_NAME, timeZone);

  const eventRes = await calendar.events.insert({
    auth,
    calendarId: newCalendar.id,
    requestBody: {
      summary,
      description,
      ...(input.location ? { location: input.location } : {}),
      start: {
        dateTime: input.startDateTime,
        timeZone,
      },
      end: {
        dateTime: endDateTime,
        timeZone,
      },
      guestsCanInviteOthers: false,
      guestsCanModify: false,
      guestsCanSeeOtherGuests: false,
      transparency: "opaque",
      visibility: "default",
    },
  });

  return JSON.stringify({
    status: "success",
    summary,
    description,
    location: input.location || null,
    calendarId: newCalendar.id,
    eventId: eventRes.data.id,
    eventLink: eventRes.data.htmlLink,
    timeZone,
    clientIp: metadata.clientIp || null,
  });
};

const createCalendarEventTool = tool(
  (input, config) => createCalendarEvent(input, config?.metadata || {}),
  {
    name: "create_calendar_event",
    description:`
    Create a Google Calendar event in a new AscendAI calendar.
    Use when the user asks to create, add, save, schedule, or put something in their calendar.
    The user only needs to provide date and time. Use the user's client time zone when available.
    You MUST set a concise event summary based on the user's actual hiking/outdoor plan.
    Include a short useful description and location if the user mentioned one.
    Do not ask for a title unless the user's request is ambiguous and no sensible event name can be inferred.
    Return a short success or failure message.`,
    schema: z.object({
      summary: z.string().min(3).max(80).describe(
        "Concise event title inferred by the LLM, for example 'Sunrise hike at Kahlenberg'."
      ),
      startDateTime: z.string().describe(
        "Event start date and time in ISO-like format, interpreted in the user's timezone, for example 2026-06-01T14:30:00."
      ),
      durationMinutes: z.number().int().min(15).max(1440).optional().describe(
        "Optional event length in minutes. Default is 60."
      ),
      description: z.string().max(500).optional().describe(
        "Short practical event description."
      ),
      location: z.string().max(200).optional().describe(
        "Place or trail name if known."
      ),
      timeZone: z.string().optional().describe(
        "IANA time zone only if explicitly known. Otherwise omit and the app will use the user's client time zone."
      ),
  })
  }
);

module.exports = { createCalendarEventTool, createCalendarEvent, createCalendarEvent_old };
